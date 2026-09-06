import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";

/** GET /api/admin/ebook/versions/:id */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requirePermission("ebook:manage");
  const version = await prisma.productVersion.findUnique({
    where: { id: params.id },
    include: { product: { select: { name: true, slug: true } }, media: true, entitlements: { select: { id: true } } },
  });
  if (!version) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, version });
}

/** POST /api/admin/ebook/versions/:id — set active/archived, or rollback target. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requirePermission("ebook:manage");
  const body = await req.json().catch(() => null);
  const action = body?.action;
  const version = await prisma.productVersion.findUnique({ where: { id: params.id } });
  if (!version) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (action === "archive" || action === "activate") {
    const nextStatus = action === "activate" ? "active" : "archived";
    // Deactivate siblings, then set this one.
    if (action === "activate") {
      await prisma.productVersion.updateMany({ where: { productId: version.productId, status: "active" }, data: { status: "archived" } });
    }
    const updated = await prisma.productVersion.update({ where: { id: params.id }, data: { status: nextStatus } });
    await logAudit({ userId: ctx.user.id, action: action === "activate" ? "EBOOK_VERSION_ACTIVATE" : "EBOOK_VERSION_ARCHIVE", resource: "ebook", resourceId: params.id, before: { status: version.status }, after: { status: nextStatus } });
    return NextResponse.json({ ok: true, version: updated });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
