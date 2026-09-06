import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/faqs */
export async function GET() {
  await requirePermission("faqs:manage");
  const faqs = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ ok: true, faqs });
}

/** POST /api/admin/faqs — create, update, delete. */
export async function POST(req: Request) {
  const ctx = await requirePermission("faqs:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    id: z.string().optional(),
    question: z.string().min(1), answer: z.string().min(1),
    category: z.string().optional(), sortOrder: z.number().int().default(0),
    isPublished: z.boolean().default(true), _delete: z.boolean().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid FAQ" }, { status: 400 });
  const p = parsed.data;

  if (p._delete && p.id) {
    await prisma.faqItem.delete({ where: { id: p.id } });
    await logAudit({ userId: ctx.user.id, action: "FAQ_DELETE", resource: "faq", resourceId: p.id });
    return NextResponse.json({ ok: true });
  }
  if (p.id) {
    const updated = await prisma.faqItem.update({ where: { id: p.id }, data: { question: p.question, answer: p.answer, category: p.category, sortOrder: p.sortOrder, isPublished: p.isPublished } });
    await logAudit({ userId: ctx.user.id, action: "FAQ_UPDATE", resource: "faq", resourceId: p.id });
    return NextResponse.json({ ok: true, id: updated.id });
  }
  const created = await prisma.faqItem.create({ data: { question: p.question, answer: p.answer, category: p.category, sortOrder: p.sortOrder, isPublished: p.isPublished } });
  await logAudit({ userId: ctx.user.id, action: "FAQ_CREATE", resource: "faq", resourceId: created.id });
  return NextResponse.json({ ok: true, id: created.id });
}
