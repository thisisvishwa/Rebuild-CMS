import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/coupons */
export async function GET() {
  await requirePermission("coupons:manage");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { orders: true } } } });
  return NextResponse.json({ ok: true, coupons });
}

/** POST /api/admin/coupons — create, update, archive, delete. */
export async function POST(req: Request) {
  const ctx = await requirePermission("coupons:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    id: z.string().optional(),
    code: z.string().min(3).toUpperCase(),
    type: z.enum(["percent", "fixed"]),
    value: z.number().int().min(0),
    isActive: z.boolean().default(true),
    usageLimit: z.number().int().min(1).nullable().optional(),
    perCustomerLimit: z.number().int().min(1).nullable().optional(),
    minOrderMinor: z.number().int().min(0).nullable().optional(),
    startsAt: z.string().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    productSlug: z.string().nullable().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid coupon", detail: parsed.error.flatten() }, { status: 400 });
  const p = parsed.data;

  if (p.id) {
    const updated = await prisma.coupon.update({
      where: { id: p.id },
      data: {
        code: p.code, type: p.type, value: p.value, isActive: p.isActive,
        usageLimit: p.usageLimit ?? null, perCustomerLimit: p.perCustomerLimit ?? null, minOrderMinor: p.minOrderMinor ?? null,
        startAt: p.startsAt ? new Date(p.startsAt) : null, expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
      },
    });
    await logAudit({ userId: ctx.user.id, action: "COUPON_UPDATE", resource: "coupon", resourceId: p.id, after: { code: p.code } });
    return NextResponse.json({ ok: true, id: p.id });
  }

  const exists = await prisma.coupon.findUnique({ where: { code: p.code } });
  if (exists) return NextResponse.json({ ok: false, error: "Code already exists" }, { status: 409 });

  const created = await prisma.coupon.create({
    data: {
      code: p.code, type: p.type, value: p.value, isActive: p.isActive,
      usageLimit: p.usageLimit ?? null, perCustomerLimit: p.perCustomerLimit ?? null, minOrderMinor: p.minOrderMinor ?? null,
      startAt: p.startsAt ? new Date(p.startsAt) : null, expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
    },
  });
  await logAudit({ userId: ctx.user.id, action: "COUPON_CREATE", resource: "coupon", resourceId: created.id, after: { code: p.code, value: p.value } });
  return NextResponse.json({ ok: true, id: created.id });
}

/** DELETE /api/admin/coupons/:id */
export async function DELETE(req: Request) {
  const ctx = await requirePermission("coupons:manage");
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  const c = await prisma.coupon.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  // Soft-archive rather than hard delete if it has orders.
  const orderCount = await prisma.order.count({ where: { couponId: id } });
  if (orderCount > 0) {
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    await logAudit({ userId: ctx.user.id, action: "COUPON_ARCHIVE", resource: "coupon", resourceId: id });
    return NextResponse.json({ ok: true, archived: true });
  }
  await prisma.coupon.delete({ where: { id } });
  await logAudit({ userId: ctx.user.id, action: "COUPON_DELETE", resource: "coupon", resourceId: id });
  return NextResponse.json({ ok: true });
}
