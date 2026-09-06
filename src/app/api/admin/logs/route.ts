import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/logs — system logs. */
export async function GET(req: Request) {
  await requirePermission("system:view");
  const url = new URL(req.url);
  const level = url.searchParams.get("level") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const where: any = {};
  if (level) where.level = level;
  if (q) where.OR = [{ message: { contains: q } }, { service: { contains: q } }, { endpoint: { contains: q } }];
  const logs = await prisma.systemLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  const counts = await prisma.systemLog.groupBy({ by: ["level"], _count: true });
  return NextResponse.json({ ok: true, logs, counts });
}

/** POST /api/admin/logs — clear old/redundant, or create a manual entry. */
export async function POST(req: Request) {
  await requirePermission("system:manage");
  const body = await req.json().catch(() => null);
  if (body?.action === "clear") {
    await prisma.systemLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - Number(body.days || 7) * 24 * 3600 * 1000) } } });
    return NextResponse.json({ ok: true });
  }
  if (body?.message) {
    await prisma.systemLog.create({ data: { level: body.level || "info", service: body.service || "admin", message: String(body.message) } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
