import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { config } from "@/lib/config";
import fs from "node:fs";
import path from "node:path";

async function checkDb() {
  const start = Date.now();
  try { await prisma.$queryRaw`SELECT 1`; return { ok: true, latencyMs: Date.now() - start }; }
  catch { return { ok: false, latencyMs: Date.now() - start, error: "DB unreachable" }; }
}

async function checkPaymentMode() {
  const providers = await prisma.paymentProvider.findMany();
  const enabled = providers.filter((p) => p.enabled);
  return {
    mode: config.payment.mode,
    enabledProviders: enabled.map((p) => p.key),
    liveConfigured: config.payment.mode === "live" && enabled.some((p) => p.liveKey),
  };
}

/** GET /api/admin/health — system health checks. */
export async function GET() {
  await requirePermission("system:view");
  const db = await checkDb();
  const payment = await checkPaymentMode();
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  const node = process.version.replace("v", "");
  let nextVersion = "n/a";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "node_modules/next/package.json"), "utf8"));
    nextVersion = pkg.version;
  } catch { /* ignore */ }
  let prismaVersion = "n/a";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "node_modules/@prisma/client/package.json"), "utf8"));
    prismaVersion = pkg.version;
  } catch { /* ignore */ }

  const checks = [
    { key: "database", label: "Database", ok: db.ok, detail: db.ok ? `OK (${db.latencyMs}ms)` : db.error },
    { key: "payment_mode", label: "Payment mode", ok: payment.mode !== "demo", detail: payment.mode === "demo" ? "Running in demo (simulated) mode" : "Live mode" },
    { key: "payment_live", label: "Live payment credentials", ok: !payment.liveConfigured ? false : payment.liveConfigured, detail: payment.liveConfigured ? "Live credentials set" : "Not configured / demo mode" },
    { key: "email", label: "Email transport", ok: config.email.transport !== "console", detail: config.email.transport === "smtp" ? `SMTP (${config.email.smtp.host})` : "Console transport (dev)" },
  ];

  return NextResponse.json({
    ok: true,
    checks, db,
    uptimeSeconds: Math.round(uptime),
    memory: { rssMb: Math.round(mem.rss / 1024 / 1024), heapMb: Math.round(mem.heapUsed / 1024 / 1024) },
    versions: { node, next: nextVersion, prisma: prismaVersion },
  });
}
