import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/content — all website sections. */
export async function GET() {
  await requirePermission("cms:view");
  const sections = await prisma.websiteSection.findMany({ orderBy: [{ sortOrder: "asc" }, { key: "asc" }] });
  const parsed = sections.map((s) => {
    let content: unknown = {};
    try { content = JSON.parse(s.content || "{}"); } catch { content = {}; }
    return { ...s, content };
  });
  return NextResponse.json({ ok: true, sections: parsed });
}

/** POST /api/admin/content — upsert a section. */
export async function POST(req: Request) {
  const ctx = await requirePermission("cms:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    id: z.string().optional(), key: z.string().min(1), label: z.string().min(1),
    sortOrder: z.number().int().default(0), isEnabled: z.boolean().default(true),
    published: z.boolean().default(true), content: z.record(z.string(), z.unknown()).default({}),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid section" }, { status: 400 });
  const p = parsed.data;
  const contentJson = JSON.stringify(p.content);

  if (p.id) {
    await prisma.websiteSection.update({ where: { id: p.id }, data: { label: p.label, sortOrder: p.sortOrder, isEnabled: p.isEnabled, published: p.published, content: contentJson, updatedById: ctx.user.id } });
  } else {
    await prisma.websiteSection.upsert({ where: { key: p.key }, update: { label: p.label, sortOrder: p.sortOrder, isEnabled: p.isEnabled, published: p.published, content: contentJson, updatedById: ctx.user.id }, create: { key: p.key, label: p.label, sortOrder: p.sortOrder, isEnabled: p.isEnabled, published: p.published, content: contentJson, history: "[]", updatedById: ctx.user.id } });
  }
  await logAudit({ userId: ctx.user.id, action: "CMS_PUBLISH", resource: "website_section", resourceId: p.key, after: { label: p.label, published: p.published } });
  return NextResponse.json({ ok: true });
}
