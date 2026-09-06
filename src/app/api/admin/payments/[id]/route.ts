import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { refundAction } from "@/lib/admin/refunds";

/** GET /api/admin/payments/:id — single payment with refunds. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requirePermission("payments:view");
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: { order: { select: { orderNumber: true, status: true, amountMinor: true } }, refunds: true },
  });
  if (!payment) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, payment });
}

/** POST /api/admin/payments/:id — dispatch to refund action. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return refundAction(req, params.id);
}
