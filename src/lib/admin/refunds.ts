import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";

/**
 * Refund processing — used by the admin payments API.
 *
 * Financial records are not freely edited. A refund is recorded as a
 * Refund line against the payment (transaction immutability, §31/§32), the
 * payment status is adjusted when fully refunded, and every action is audited.
 */
export async function refundAction(req: Request, id: string) {
  const ctx = await requirePermission("payments:refund");
  const body = await req.json().catch(() => null);
  const amountMinor = Number(body?.amountMinor);
  const reason = String(body?.reason || "").trim();

  if (!Number.isInteger(amountMinor) || amountMinor <= 0) return NextResponse.json({ ok: false, error: "Invalid amount" }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id }, include: { order: true, refunds: true } });
  if (!payment) return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
  const alreadyRefunded = payment.refunds.reduce((s, r) => s + r.amountMinor, 0);
  const available = payment.amountMinor - alreadyRefunded;
  if (amountMinor > available) return NextResponse.json({ ok: false, error: "Amount exceeds refundable balance" }, { status: 400 });

  // Record the refund line. In demo mode we simulate a successful provider
  // refund; in live mode a real provider refund would be issued here.
  const refund = await prisma.refund.create({
    data: { orderId: payment.orderId, paymentId: payment.id, amountMinor, currency: payment.currency, reason, status: "processed", processedAt: new Date(), adminId: ctx.user.id },
  });

  const refundedTotal = alreadyRefunded + amountMinor;
  if (refundedTotal >= payment.amountMinor) {
    await prisma.payment.update({ where: { id }, data: { status: "refunded" } });
  }

  await logAudit({ userId: ctx.user.id, action: "PAYMENT_REFUND", resource: "payment", resourceId: payment.id, before: { amountMinor: payment.amountMinor, refundedMinor: alreadyRefunded }, after: { refundMinor: amountMinor, reason }, ip: req.headers.get("x-forwarded-for")?.split(",")[0] });
  return NextResponse.json({ ok: true, refundId: refund.id });
}
