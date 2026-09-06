import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/downloads */
export async function GET(req: Request) {
  await requirePermission("orders:view");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const where: any = {};
  if (q) where.OR = [{ customer: { email: { contains: q } } }, { product: { name: { contains: q } } }];

  const downloads = await prisma.download.findMany({
    where, orderBy: { createdAt: "desc" }, take: 100,
    include: { customer: { select: { email: true, name: true } }, product: { select: { name: true } }, version: { select: { version: true } } },
  });
  const counts = await prisma.download.groupBy({ by: ["status"], _count: true });
  return NextResponse.json({ ok: true, downloads, counts });
}
