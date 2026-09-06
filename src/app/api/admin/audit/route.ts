import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/audit — immutable audit trail (append-only, no edit). */
export async function GET(req: Request) {
  await requirePermission("audit:view");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const where: any = {};
  if (q) where.OR = [{ action: { contains: q } }, { resource: { contains: q } }, { user: { email: { contains: q } } }];
  const logs = await prisma.auditLog.findMany({
    where, orderBy: { createdAt: "desc" }, take: 200,
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ ok: true, logs });
}

/** Audit logs are append-only — no POST/PUT/DELETE writers defined here. */
