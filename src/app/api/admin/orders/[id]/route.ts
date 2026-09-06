import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { fulfillOrder, ensureCustomer } from "@/lib/admin/fulfillment";
import { sendEmail, buildAccessUrlForOrder } from "@/lib/email";
import { getClientIp } from "@/lib/admin/auth";
import { z } from "zod";

/** GET /api/admin/orders/:id — full detail. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requirePermission("orders:view");
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      payments: { orderBy: { createdAt: "desc" } },
      invoice: true,
      entitlements: { include: { version: true } },
      items: true,
      refunds: true,
      notes: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true, order });
}

/** POST /api/admin/orders/:id — controlled order actions (fulfill, refund, note). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requirePermission("orders:manage");
  const body = await req.json().catch(() => null);
  const action = body?.action as string;

  if (action === "fulfill") {
    const result = await fulfillOrder(params.id, { adminId: ctx.user.id });
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === "resend_access") {
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    const accessUrl = await buildAccessUrlForOrder({ orderNumber: order.orderNumber, email: order.email });
    await sendEmail({ to: order.email, subject: `Your ${order.productName} digital access`, text: `Access your copy: ${accessUrl}` });
    await prisma.emailLog.create({ data: { to: order.email, template: "ebook_access", subject: "Digital access", provider: "manual", status: "sent", orderId: order.id } });
    await logAudit({ userId: ctx.user.id, action: "ORDER_RESEND_ACCESS", resource: "order", resourceId: order.id });
    return NextResponse.json({ ok: true });
  }

  if (action === "note") {
    const note = String(body?.note ?? "").slice(0, 2000);
    if (!note) return NextResponse.json({ ok: false, error: "Note is required" }, { status: 400 });
    await prisma.adminNote.create({ data: { orderId: params.id, adminId: ctx.user.id, note } });
    return NextResponse.json({ ok: true });
  }

  if (action === "grant_access") {
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    const customer = await ensureCustomer(order.email, order.name, order.country ?? undefined);
    await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id, accessGranted: true, status: "paid" } });
    const result = await fulfillOrder(order.id, { adminId: ctx.user.id });
    await logAudit({ userId: ctx.user.id, action: "ORDER_GRANT_ACCESS", resource: "order", resourceId: order.id, description: `Granted access for ${order.email}` });
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
