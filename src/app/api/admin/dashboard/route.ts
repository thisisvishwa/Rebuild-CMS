import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/dashboard — executive overview computed from real records. */
export async function GET() {
  await requirePermission("dashboard:view");

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const revenueRange = async (from: Date) => {
    const agg = await prisma.order.aggregate({
      _sum: { amountMinor: true },
      where: { status: "paid", createdAt: { gte: from } },
    });
    return agg._sum.amountMinor ?? 0;
  };

  const [todayRev, weekRev, monthRev, totalAgg, aovAgg, orderCounts, customerCounts, todayVisitors, uniqueVisitors, downloads] = await Promise.all([
    revenueRange(startOfDay),
    revenueRange(startOfWeek),
    revenueRange(startOfMonth),
    prisma.order.aggregate({ _sum: { amountMinor: true }, where: { status: "paid" } }),
    prisma.order.aggregate({ _avg: { amountMinor: true }, _count: true, where: { status: "paid" } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.customer.count(),
    prisma.visitor.count({ where: { lastSeen: { gte: startOfDay } } }),
    prisma.visitor.count(),
    prisma.download.aggregate({ _count: true, _max: { createdAt: true } }),
  ]);

  const statusCounts = Object.fromEntries(orderCounts.map((o) => [o.status, o._count]));
  const customersToday = await prisma.customer.count({ where: { createdAt: { gte: startOfDay } } });
  const conversions = await conversionRates();
  const traffic = await trafficBreakdown();
  const recentOrders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 });
  const recentCustomers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 5 });

  const totalRevenue = totalAgg._sum.amountMinor ?? 0;
  // Values are returned in MINOR units; the client formats with formatCurrency.
  const fmt = (n: number) => n;

  return NextResponse.json({
    ok: true,
    sales: {
      today: fmt(todayRev),
      week: fmt(weekRev),
      month: fmt(monthRev),
      total: fmt(totalRevenue),
      aov: fmt(aovAgg._avg.amountMinor ?? 0),
    },
    orders: {
      total: aovAgg._count,
      paid: statusCounts.paid ?? 0,
      pending: (statusCounts.pending ?? 0) + (statusCounts.pending_verification ?? 0),
      failed: statusCounts.failed ?? 0,
      cancelled: statusCounts.cancelled ?? 0,
      refunded: statusCounts.refunded ?? 0,
    },
    customers: {
      total: customerCounts ?? 0,
      newToday: customersToday,
    },
    visitors: {
      activeToday: todayVisitors,
      unique: uniqueVisitors,
      avgDuration: 0, // computed in analytics module
    },
    conversions,
    downloads: {
      total: downloads._count ?? 0,
      latest: downloads._max.createdAt,
    },
    traffic,
    recentOrders: recentOrders.map((o) => ({
      id: o.id, orderNumber: o.orderNumber, name: o.name, email: o.email,
      amount: fmt(o.amountMinor), currency: o.currency, status: o.status, createdAt: o.createdAt,
    })),
    recentCustomers,
  });
}

async function conversionRates() {
  // Derived funnel from analytics (best-effort; 0 when not tracked yet).
  const sessions = await prisma.visitorSession.count();
  const checkout = await prisma.visitorSession.count({ where: { checkoutStarted: true } });
  const payment = await prisma.visitorSession.count({ where: { paymentInitiated: true } });
  const purchase = await prisma.visitorSession.count({ where: { purchaseCompleted: true } });
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
  return {
    visitorToCheckout: pct(checkout, sessions),
    checkoutToPayment: pct(payment, checkout),
    paymentToPurchase: pct(purchase, payment),
    overall: pct(purchase, sessions),
  };
}

async function trafficBreakdown() {
  const sessions = await prisma.visitorSession.findMany({
    select: { utmSource: true, referrer: true, purchaseCompleted: true },
    orderBy: { startedAt: "desc" },
    take: 3000,
  });

  const buckets: Record<string, { visitors: number; purchases: number }> = {};
  for (const s of sessions) {
    const source = s.utmSource || (s.referrer ? "referral" : "direct");
    if (!buckets[source]) buckets[source] = { visitors: 0, purchases: 0 };
    buckets[source].visitors += 1;
    if (s.purchaseCompleted) buckets[source].purchases += 1;
  }

  const known: Record<string, string> = {
    instagram: "Instagram", facebook: "Facebook", google: "Google", youtube: "YouTube",
    whatsapp: "WhatsApp", linkedin: "LinkedIn", twitter: "X", linktree: "Other",
    email: "Email", newsletter: "Email", direct: "Direct", referral: "Referral",
  };
  const out = Object.entries(buckets).map(([key, v]) => ({
    source: known[key.toLowerCase()] ?? (key.length > 1 ? key.charAt(0).toUpperCase() + key.slice(1) : "Other"),
    visitors: v.visitors,
    purchases: v.purchases,
  })).sort((a, b) => b.visitors - a.visitors);
  return out;
}
