import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, hasPermission } from "@/lib/admin/auth";

/** GET /api/admin/search?q= — global admin search across entities (§74). */
export async function GET(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ ok: true, results: [] });

  const like = { contains: q };

  const results: { label: string; href: string }[] = [];

  if (hasPermission(ctx, "orders:view")) {
    const orders = await prisma.order.findMany({
      where: { OR: [{ orderNumber: like }, { email: like }, { name: like }, { paymentId: like }] },
      take: 6,
    });
    results.push(...orders.map((o) => ({ label: `Order ${o.orderNumber} — ${o.name}`, href: `/admin/orders/${o.id}` })));
  }
  if (hasPermission(ctx, "customers:view")) {
    const customers = await prisma.customer.findMany({ where: { OR: [{ email: like }, { name: like }] }, take: 6 });
    results.push(...customers.map((c) => ({ label: `Customer ${c.name} (${c.email})`, href: `/admin/customers/${c.id}` })));
  }
  if (hasPermission(ctx, "payments:view")) {
    const payments = await prisma.payment.findMany({
      where: { OR: [{ providerPaymentId: like }, { providerOrderId: like }] },
      take: 6,
      include: { order: { select: { orderNumber: true } } },
    });
    results.push(...payments.map((p) => ({ label: `Payment ${p.providerPaymentId ?? p.id} — order ${p.order?.orderNumber ?? ""}`, href: `/admin/payments` })));
  }
  if (hasPermission(ctx, "coupons:manage")) {
    const coupons = await prisma.coupon.findMany({ where: { code: like }, take: 4 });
    results.push(...coupons.map((c) => ({ label: `Coupon ${c.code}`, href: `/admin/coupons` })));
  }
  if (hasPermission(ctx, "cms:manage")) {
    const faqs = await prisma.faqItem.findMany({ where: { question: like }, take: 4 });
    results.push(...faqs.map((f) => ({ label: `FAQ: ${f.question}`, href: `/admin/faqs` })));
  }

  return NextResponse.json({ ok: true, results });
}
