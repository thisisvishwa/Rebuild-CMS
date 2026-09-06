import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/notifications */
export async function GET(req: Request) {
  await requirePermission("dashboard:view");
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take")) || 50, 100);
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take });
  const unread = await prisma.notification.count({ where: { read: false } });
  return NextResponse.json({ ok: true, notifications, unread });
}

/** POST /api/admin/notifications — mark read/all-read, or create. */
export async function POST(req: Request) {
  await requirePermission("dashboard:view");
  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action === "markRead" && body?.id) {
    await prisma.notification.update({ where: { id: body.id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (action === "markAllRead") {
    await prisma.notification.updateMany({ data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (action === "create" && body?.title) {
    await prisma.notification.create({ data: { type: body.type || "system", title: body.title, body: body.body, link: body.link } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
