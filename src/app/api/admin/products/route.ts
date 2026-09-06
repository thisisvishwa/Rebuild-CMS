import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/products */
export async function GET() {
  await requirePermission("products:view");
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: { versions: { orderBy: { uploadedAt: "desc" }, take: 1 }, _count: { select: { orders: true } } },
  });
  return NextResponse.json({ ok: true, products });
}

/** POST /api/admin/products — create or update. */
export async function POST(req: Request) {
  const ctx = await requirePermission("products:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    id: z.string().optional(),
    name: z.string().min(1), slug: z.string().min(1), description: z.string().optional(),
    shortDescription: z.string().optional(), priceMinor: z.number().int().min(0),
    currency: z.string().default("USD"), isActive: z.boolean().default(true),
    features: z.array(z.object({ title: z.string().min(1), text: z.string().optional() })).optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid product data" }, { status: 400 });
  const p = parsed.data;

  if (p.id) {
    const prev = await prisma.product.findUnique({ where: { id: p.id } });
    const updated = await prisma.product.update({
      where: { id: p.id },
      data: {
        name: p.name, slug: p.slug, description: p.description, shortDescription: p.shortDescription,
        priceMinor: p.priceMinor, currency: p.currency, isActive: p.isActive,
      },
    });
    const productId = p.id as string;
    if (p.features) {
      await prisma.productFeature.deleteMany({ where: { productId } });
      await prisma.productFeature.createMany({ data: p.features.map((f, i) => ({ productId, title: f.title, text: f.text, sortOrder: i })) });
    }
    if (prev && prev.priceMinor !== p.priceMinor) {
      await logAudit({ userId: ctx.user.id, action: "PRICE_CHANGE", resource: "product", resourceId: p.id, before: { priceMinor: prev.priceMinor }, after: { priceMinor: p.priceMinor } });
    }
    return NextResponse.json({ ok: true, id: p.id });
  }

  const created = await prisma.product.create({
    data: {
      slug: p.slug, name: p.name, description: p.description, shortDescription: p.shortDescription,
      priceMinor: p.priceMinor, currency: p.currency, isActive: p.isActive,
      features: { create: (p.features ?? []).map((f, i) => ({ title: f.title, text: f.text, sortOrder: i })) },
    },
  });
  await logAudit({ userId: ctx.user.id, action: "PRODUCT_CREATE", resource: "product", resourceId: created.id, after: { name: p.name, priceMinor: p.priceMinor } });
  return NextResponse.json({ ok: true, id: created.id });
}
