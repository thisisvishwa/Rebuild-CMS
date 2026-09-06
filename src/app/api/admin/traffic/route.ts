import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/traffic — traffic sources & attribution. */
export async function GET(req: Request) {
  await requirePermission("analytics:view");
  const url = new URL(req.url);
  const days = Math.min(Number(url.searchParams.get("days")) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  const bySource = await prisma.visitorSession.groupBy({
    by: ["utmSource"], where: { startedAt: { gte: since } }, _count: true,
  });
  const byMedium = await prisma.visitorSession.groupBy({
    by: ["utmMedium"], where: { startedAt: { gte: since } }, _count: true,
  });
  const byCampaign = await prisma.visitorSession.groupBy({
    by: ["utmCampaign"], where: { startedAt: { gte: since } }, _count: true,
  });
  const byReferrer = await prisma.visitor.groupBy({
    by: ["referrer"], where: { lastSeen: { gte: since } }, _count: true,
  });

  const sessions = await prisma.visitorSession.count({ where: { startedAt: { gte: since } } });
  const purchases = await prisma.visitorSession.count({ where: { startedAt: { gte: since }, purchaseCompleted: true } });

  const sourceRows = bySource
    .map((s) => ({ label: s.utmSource ?? "(direct)", count: s._count }))
    .sort((a, b) => b.count - a.count);
  const top = sourceRows.slice(0, 5).reduce((s, r) => s + r.count, 0);
  const sourceConversions = sourceRows.map((s) => ({ ...s, rate: sessions ? Math.round((purchases / sessions) * 100 * (s.count / (top || 1))) : 0 }));

  return NextResponse.json({
    ok: true,
    totalSessions: sessions,
    totalPurchases: purchases,
    bySource: sourceRows,
    byMedium: byMedium.map((m) => ({ label: m.utmMedium ?? "—", count: m._count })).sort((a, b) => b.count - a.count),
    byCampaign: byCampaign.map((c) => ({ label: c.utmCampaign ?? "—", count: c._count })).sort((a, b) => b.count - a.count),
    byReferrer: byReferrer.map((r) => ({ label: r.referrer ?? "(direct)", count: r._count })).sort((a, b) => b.count - a.count).slice(0, 12),
  });
}
