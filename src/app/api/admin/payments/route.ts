import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/payments */
export async function GET(req: Request) {
  await requirePermission("payments:view");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const take = 50;
  const where: any = {};
  if (q) where.OR = [{ order: { orderNumber: { contains: q } } }, { providerPaymentId: { contains: q } }];
  if (status) where.status = status;

  const payments = await prisma.payment.findMany({
    where, orderBy: { createdAt: "desc" }, take,
    include: { order: { select: { orderNumber: true, status: true } }, refunds: true },
  });
  const totals = await prisma.payment.aggregate({ where: { status: "captured" }, _sum: { amountMinor: true } });
  return NextResponse.json({ ok: true, payments, capturedTotalMinor: totals._sum.amountMinor ?? 0 });
}
