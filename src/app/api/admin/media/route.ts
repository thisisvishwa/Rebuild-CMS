import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { storePrivateFile } from "@/lib/admin/storage";

/** GET /api/admin/media — list media library. */
export async function GET(req: Request) {
  await requirePermission("media:manage");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const where: any = {};
  if (q) where.OR = [{ originalName: { contains: q } }, { alt: { contains: q } }];
  const media = await prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ ok: true, media });
}

/** POST /api/admin/media — upload file(s). */
export async function POST(req: Request) {
  await requirePermission("media:manage");
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });

  const results = [];
  for (const file of files) {
    try {
      const r = await storePrivateFile(file, { alt: (form.get("alt") as string) || undefined, isPrivate: true });
      results.push({ ok: true, id: r.media.id, url: r.media.url, name: file.name });
    } catch (e) {
      results.push({ ok: false, name: file.name, error: e instanceof Error ? e.message : "Upload failed" });
    }
  }
  const anyOk = results.some((r) => r.ok);
  return NextResponse.json({ ok: anyOk, results });
}

/** DELETE /api/admin/media/:id */
export async function DELETE(req: Request) {
  await requirePermission("media:manage");
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
