import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/analytics — chart + funnel data. */
export async function GET(req: Request) {
  await requirePermission("analytics:view");
  const url = new URL(req.url);
  const days = Math.min(Number(url.searchParams.get("days")) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  // Page views by day.
  const pageViews = await prisma.pageView.findMany({ where: { viewedAt: { gte: since } }, select: { viewedAt: true } });
  const visitorsByDay = await prisma.visitor.count({ where: { lastSeen: { gte: since } } });

  const viewsSeries: { date: string; count: number }[] = [];
  const byDay = new Map<string, number>();
  for (const pv of pageViews) {
    const k = pv.viewedAt.toISOString().slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    const k = d.toISOString().slice(0, 10);
    viewsSeries.push({ date: k, count: byDay.get(k) ?? 0 });
  }

  // Event breakdown.
  const events = await prisma.analyticsEvent.findMany({ where: { createdAt: { gte: since } }, select: { event: true, category: true } });
  const eventCounts: Record<string, number> = {};
  for (const e of events) eventCounts[e.event] = (eventCounts[e.event] ?? 0) + 1;

  // Funnel (sessions that reached each stage) — flags are booleans, so count each.
  const sessionTotal = await prisma.visitorSession.count({ where: { startedAt: { gte: since } } });
  const checkoutStarted = await prisma.visitorSession.count({ where: { startedAt: { gte: since }, checkoutStarted: true } });
  const paymentInitiated = await prisma.visitorSession.count({ where: { startedAt: { gte: since }, paymentInitiated: true } });
  const purchaseCompleted = await prisma.visitorSession.count({ where: { startedAt: { gte: since }, purchaseCompleted: true } });
  const downloaded = await prisma.visitorSession.count({ where: { startedAt: { gte: since }, downloaded: true } });

  // Device breakdown.
  const devices = await prisma.visitor.groupBy({ by: ["device"], _count: true });
  const countries = await prisma.visitor.groupBy({ by: ["country"], _count: true, _min: { lastSeen: true } });
  const topCountries = countries.filter((c) => c.country).sort((a, b) => b._count - a._count).slice(0, 8);

  return NextResponse.json({
    ok: true,
    series: viewsSeries, eventCounts,
    deviceBreakdown: devices.map((d) => ({ label: d.device ?? "unknown", count: d._count })),
    topCountries: topCountries.map((c) => ({ label: c.country ?? "Unknown", count: c._count })),
    funnel: {
      visitors: visitorsByDay,
      sessions: sessionTotal,
      checkoutStarted,
      paymentInitiated,
      purchaseCompleted,
      downloaded,
    },
  });
}
