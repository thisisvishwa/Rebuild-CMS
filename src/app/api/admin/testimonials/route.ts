import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/testimonials */
export async function GET() {
  await requirePermission("testimonials:manage");
  const testimonials = await prisma.testimonialItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ ok: true, testimonials });
}

/** POST /api/admin/testimonials */
export async function POST(req: Request) {
  const ctx = await requirePermission("testimonials:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    id: z.string().optional(), name: z.string().min(1), quote: z.string().min(3),
    age: z.number().int().nullable().optional(), situation: z.string().nullable().optional(),
    location: z.string().nullable().optional(), imageUrl: z.string().nullable().optional(),
    permission: z.string().nullable().optional(), sortOrder: z.number().int().default(0),
    isPublished: z.boolean().default(true), _delete: z.boolean().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid testimonial", detail: parsed.error.flatten() }, { status: 400 });
  const p = parsed.data;

  if (p._delete && p.id) {
    await prisma.testimonialItem.delete({ where: { id: p.id } });
    await logAudit({ userId: ctx.user.id, action: "TESTIMONIAL_DELETE", resource: "testimonial", resourceId: p.id });
    return NextResponse.json({ ok: true });
  }
  const data = { name: p.name, quote: p.quote, age: p.age ?? null, situation: p.situation ?? null, location: p.location ?? null, imageUrl: p.imageUrl ?? null, permission: p.permission ?? null, sortOrder: p.sortOrder, isPublished: p.isPublished };
  if (p.id) {
    await prisma.testimonialItem.update({ where: { id: p.id }, data });
    await logAudit({ userId: ctx.user.id, action: "TESTIMONIAL_UPDATE", resource: "testimonial", resourceId: p.id });
    return NextResponse.json({ ok: true, id: p.id });
  }
  const created = await prisma.testimonialItem.create({ data });
  await logAudit({ userId: ctx.user.id, action: "TESTIMONIAL_CREATE", resource: "testimonial", resourceId: created.id });
  return NextResponse.json({ ok: true, id: created.id });
}
