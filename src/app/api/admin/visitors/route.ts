import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/visitors — live/recent visitors and sessions. */
export async function GET(req: Request) {
  await requirePermission("analytics:view");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const where: any = {};
  if (q) where.OR = [{ country: { contains: q } }, { referrer: { contains: q } }, { utmSource: { contains: q } }, { visitorId: { contains: q } }];

  const visitors = await prisma.visitor.findMany({
    where, orderBy: { lastSeen: "desc" }, take: 100,
    include: { sessions: { orderBy: { startedAt: "desc" }, take: 1 } },
  });

  const online = await prisma.visitorSession.count({ where: { isActive: true, endedAt: null, startedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } } });
  const totalVisitors = await prisma.visitor.count();
  const sessions24h = await prisma.visitorSession.count({ where: { startedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } });
  const pageviews24h = await prisma.pageView.count({ where: { viewedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } });

  return NextResponse.json({ ok: true, visitors, stats: { online, totalVisitors, sessions24h, pageviews24h } });
}
