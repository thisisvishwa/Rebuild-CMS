import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

const EMPTY_SECTION: Array<{ heading: string; body: string }> = [];

function parseContent(content: string): Array<{ heading: string; body: string }> {
  try {
    const arr = JSON.parse(content);
    return Array.isArray(arr) ? arr : EMPTY_SECTION;
  } catch {
    return EMPTY_SECTION;
  }
}

/** GET /api/admin/legal */
export async function GET() {
  await requirePermission("legal:manage");
  const pages = await prisma.legalPage.findMany({ orderBy: { slug: "asc" } });
  const mapped = pages.map((p) => ({ ...p, content: parseContent(p.content) }));
  return NextResponse.json({ ok: true, pages: mapped });
}

/** POST /api/admin/legal — upsert a page content. */
export async function POST(req: Request) {
  const ctx = await requirePermission("legal:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    slug: z.string().min(1), title: z.string().min(1), updated: z.string().nullable().optional(),
    intro: z.string().nullable().optional(), status: z.enum(["draft", "published"]).default("published"),
    content: z.array(z.object({ heading: z.string(), body: z.string() })).default([]),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid legal page" }, { status: 400 });
  const p = parsed.data;

  const existing = await prisma.legalPage.findUnique({ where: { slug: p.slug } });
  const contentJson = JSON.stringify(p.content);
  const data = {
    title: p.title, updated: p.updated ?? null, intro: p.intro ?? null,
    status: p.status, content: contentJson,
    updatedById: ctx.user.id,
    ...(p.status === "published" && existing && !existing.publishedAt ? { publishedAt: new Date() } : {}),
  };
  if (existing) {
    const history = parseExistingHistory(existing.history);
    history.push({ version: history.length + 1, author: ctx.user.id, date: new Date().toISOString(), published: existing.status === "published" });
    await prisma.legalPage.update({ where: { slug: p.slug }, data: { ...data, history: JSON.stringify(history.slice(-30)) } });
    await logAudit({ userId: ctx.user.id, action: "LEGAL_UPDATE", resource: "legal", resourceId: p.slug, after: { status: p.status } });
  } else {
    await prisma.legalPage.create({ data: { slug: p.slug, ...data } });
    await logAudit({ userId: ctx.user.id, action: "LEGAL_CREATE", resource: "legal", resourceId: p.slug, after: { status: p.status } });
  }
  return NextResponse.json({ ok: true });
}

function parseExistingHistory(h: string): any[] {
  try { const a = JSON.parse(h); return Array.isArray(a) ? a : []; } catch { return []; }
}
