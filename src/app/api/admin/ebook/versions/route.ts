import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { storePrivateFile } from "@/lib/admin/storage";
import { z } from "zod";

/** GET /api/admin/ebook/versions — all product versions. */
export async function GET() {
  await requirePermission("ebook:manage");
  const versions = await prisma.productVersion.findMany({
    orderBy: [{ productId: "asc" }, { uploadedAt: "desc" }],
    include: { product: { select: { name: true, slug: true } }, media: { select: { size: true, originalName: true, mimeType: true } }, entitlements: { select: { id: true } } },
  });
  return NextResponse.json({ ok: true, versions });
}

/** POST /api/admin/ebook/versions — upload/register a new version. */
export async function POST(req: Request) {
  const ctx = await requirePermission("ebook:manage");
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const version = String(form.get("version") || "").trim();
  const productId = String(form.get("productId") || "").trim();
  const releaseNotes = String(form.get("releaseNotes") || "").trim() || undefined;
  const file = form.get("file");

  if (!version || !productId) return NextResponse.json({ ok: false, error: "Version and product are required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "A file is required" }, { status: 400 });

  const stored = await storePrivateFile(file, { isPrivate: true });
  const created = await prisma.productVersion.create({
    data: {
      productId,
      version,
      mediaId: stored.media.id,
      fileSize: stored.file.size,
      fileHash: stored.file.hash,
      releaseNotes,
      status: "active",
      uploadedById: ctx.user.id,
    },
  });

  await logAudit({ userId: ctx.user.id, action: "EBOOK_VERSION_UPLOAD", resource: "ebook", resourceId: created.id, after: { version, size: stored.file.size, hash: stored.file.hash } });
  return NextResponse.json({ ok: true, id: created.id });
}
