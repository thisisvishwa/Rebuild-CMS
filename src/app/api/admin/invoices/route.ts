import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";

/** GET /api/admin/invoices */
export async function GET(req: Request) {
  await requirePermission("invoices:view");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const where: any = {};
  if (q) where.OR = [{ number: { contains: q } }, { order: { orderNumber: { contains: q } } }, { customer: { email: { contains: q } } }];

  const invoices = await prisma.invoice.findMany({
    where, orderBy: { issuedAt: "desc" }, take: 100,
    include: { order: { select: { orderNumber: true } }, customer: { select: { email: true, name: true } } },
  });
  return NextResponse.json({ ok: true, invoices });
}

/** POST /api/admin/invoices/:id — mark sent or re-email. */
export async function POST(req: Request) {
  const ctx = await requirePermission("invoices:manage");
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  const body = await req.json().catch(() => null);
  const action = body?.action;

  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { order: { include: { customer: true } } } });
  if (!invoice) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (action === "markSent") {
    await prisma.invoice.update({ where: { id }, data: { emailStatus: "sent" } });
    await logAudit({ userId: ctx.user.id, action: "INVOICE_MARK_SENT", resource: "invoice", resourceId: id });
    return NextResponse.json({ ok: true });
  }

  if (action === "markUnpaid" || action === "markPaid") {
    const nextStatus = action === "markPaid" ? "paid" : "unpaid";
    await prisma.invoice.update({ where: { id }, data: { status: nextStatus } });
    await logAudit({ userId: ctx.user.id, action: action === "markPaid" ? "INVOICE_MARK_PAID" : "INVOICE_MARK_UNPAID", resource: "invoice", resourceId: id });
    return NextResponse.json({ ok: true });
  }

  // Resend the invoice email (queues an EmailLog; delivery handled by mailer).
  if (action === "resend" && invoice.order?.customer?.email) {
    await prisma.emailLog.create({ data: { to: invoice.order.customer.email, template: "invoice", subject: `Invoice ${invoice.number}`, provider: "system", status: "queued", orderId: invoice.orderId, customerId: invoice.order.customerId || null } });
    await prisma.invoice.update({ where: { id }, data: { emailStatus: "sent" } });
    await logAudit({ userId: ctx.user.id, action: "INVOICE_RESEND", resource: "invoice", resourceId: id });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
