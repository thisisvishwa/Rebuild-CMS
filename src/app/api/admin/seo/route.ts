import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/seo */
export async function GET() {
  await requirePermission("seo:manage");
  const seo = await prisma.seoConfig.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json({ ok: true, seo });
}

/** POST /api/admin/seo — update a page's SEO metadata. */
export async function POST(req: Request) {
  const ctx = await requirePermission("seo:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    slug: z.string().min(1), title: z.string().nullable().optional(),
    description: z.string().nullable().optional(), ogTitle: z.string().nullable().optional(),
    ogDescription: z.string().nullable().optional(), ogImage: z.string().nullable().optional(),
    canonical: z.string().nullable().optional(), robots: z.string().nullable().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid SEO data" }, { status: 400 });
  const p = parsed.data;

  const existing = await prisma.seoConfig.findUnique({ where: { slug: p.slug } });
  const data = {
    title: p.title ?? null, description: p.description ?? null, ogTitle: p.ogTitle ?? null,
    ogDescription: p.ogDescription ?? null, ogImage: p.ogImage ?? null, canonical: p.canonical ?? null, robots: p.robots ?? null,
  };
  if (existing) {
    await prisma.seoConfig.update({ where: { slug: p.slug }, data });
  } else {
    await prisma.seoConfig.create({ data: { slug: p.slug, ...data } });
  }
  await logAudit({ userId: ctx.user.id, action: "SEO_UPDATE", resource: "seo", resourceId: p.slug });
  return NextResponse.json({ ok: true });
}
