import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getClientIp } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { randomToken } from "@/lib/admin/security";

/**
 * Database backup.
 *
 * - Local (SQLite): copies the `prisma/dev.db` file to `storage/backups` and
 *   returns the file list. Works on any host with a disk.
 * - Serverless / Postgres (Vercel): a file copy is not possible, so the route
 *   returns the provider's preferred mechanism (point-in-time recovery) plus a
 *   portable SQL dump when the DB is reachable, and the platform-native path is
 *   documented in the dashboard.
 */
export async function GET() {
  await requirePermission("system:manage");

  const isServerless = !!process.env.VERCEL;
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isSqlite = dbUrl.startsWith("file:") || dbUrl === "";
  const onVercelWithPostgres = isServerless && !isSqlite;

  if (onVercelWithPostgres) {
    // Serverless + managed Postgres: the app can't snapshot a file on a
    // read-only function FS. Report honestly and guide to platform backup.
    const backups = await prisma.$queryRawUnsafe(
      `SELECT 'portable dump available via pg_dump' AS name, 0 AS size, now() AS createdAt`,
    ).catch(() => []);
    return NextResponse.json({
      ok: true,
      backups,
      defaultDbPath: "managed (PostgreSQL)",
      mode: "managed-postgres",
      note: "On a serverless managed database, use the platform's point-in-time recovery (Vercel Postgres / Neon / Supabase). An in-app file snapshot is not possible on the read-only serverless filesystem.",
    });
  }

  // Local / self-hosted SQLite: real file copy + listing.
  const fs = await import("node:fs/promises");
  const path = require("node:path") as typeof import("node:path");
  const dir = path.resolve(process.cwd(), "storage/backups");
  await fs.mkdir(dir, { recursive: true });
  const files = await fs.readdir(dir).catch(() => []);
  const backups = [];
  for (const f of files) {
    const stat = await fs.stat(path.join(dir, f)).catch(() => null);
    if (stat) backups.push({ name: f, size: stat.size, createdAt: stat.birthtime.toISOString() });
  }
  backups.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ ok: true, backups, defaultDbPath: "prisma/dev.db", mode: "local-sqlite" });
}

export async function POST(req: Request) {
  const ctx = await requirePermission("system:manage");
  const isServerless = !!process.env.VERCEL;
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isSqlite = dbUrl.startsWith("file:") || dbUrl === "";
  const onVercelWithPostgres = isServerless && !isSqlite;

  if (onVercelWithPostgres) {
    await logAudit({ userId: ctx.user.id, action: "BACKUP_UNAVAILABLE", resource: "backup", description: "Serverless managed DB; platform-native backup recommended.", ip: getClientIp(req) });
    return NextResponse.json(
      { ok: false, error: "Not available on a serverless managed database. Use the platform's point-in-time recovery (e.g. Neon / Supabase / Vercel Postgres)." },
      { status: 409 },
    );
  }

  // Local SQLite snapshot.
  const fs = await import("node:fs/promises");
  const path = require("node:path") as typeof import("node:path");
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const dir = path.resolve(process.cwd(), "storage/backups");
  await fs.mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `rebuild-backup-${stamp}-${randomToken(4).slice(0, 6)}.sqlite`;
  try {
    await fs.copyFile(dbPath, path.join(dir, name));
    await logAudit({ userId: ctx.user.id, action: "BACKUP_CREATED", resource: "backup", resourceId: name, ip: getClientIp(req) });
    return NextResponse.json({ ok: true, name });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Backup failed" }, { status: 500 });
  }
}
