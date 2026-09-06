import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { createNotification } from "@/lib/admin/notify";
import { fulfillOrder } from "@/lib/admin/fulfillment";
import { getClientIp } from "@/lib/admin/auth";
import { z } from "zod";

/** GET /api/admin/orders — filtered & paginated order list. */
export async function GET(req: Request) {
  const ctx = await requirePermission("orders:view");
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const per = Number(url.searchParams.get("per") ?? 20);
  const status = url.searchParams.get("status") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const sort = url.searchParams.get("sort") ?? "desc";

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { email: { contains: q } },
      { name: { contains: q } },
      { paymentId: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
      skip: (page - 1) * per,
      take: per,
      include: { customer: { select: { id: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    items: items.map((o) => ({
      id: o.id, orderNumber: o.orderNumber, name: o.name, email: o.email,
      amountMinor: o.amountMinor, currency: o.currency, status: o.status,
      method: o.method, createdAt: o.createdAt, accessGranted: o.accessGranted,
    })),
    total, page, pages: Math.ceil(total / per),
  });
}

/** POST /api/admin/orders — admin manual order (§85). */
export async function POST(req: Request) {
  const ctx = await requirePermission("orders:manage");
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    name: z.string().min(1), email: z.string().email(), productId: z.string().optional(),
    amountMinor: z.number().int().positive(), currency: z.string().default("USD"),
    status: z.enum(["paid", "pending"]).default("paid"),
    reason: z.string().min(1),
  }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please fill in all required fields." }, { status: 400 });
  }

  const { name, email, productId, amountMinor, currency, status, reason } = parsed.data;
  // Resolve the product (so the entitlement/delivery is valid); fall back to the
  // first active product when the admin didn't specify one.
  const resolvedProduct = await prisma.product.findFirst({
    where: productId ? { id: productId } : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const runner = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: `RB-MANUAL-${Date.now().toString(36).toUpperCase()}`,
        productId: resolvedProduct?.id ?? null,
        productName: resolvedProduct?.name ?? "Manual order",
        amountMinor,
        currency,
        status,
        method: "manual",
        name, email,
        isManual: true,
        manualReason: reason,
        accessGranted: status === "paid",
      },
    });
    const customer = await tx.customer.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: { email: email.toLowerCase(), name },
    });
    return { order, customer };
  });

  await logAudit({ userId: ctx.user.id, action: "ORDER_MANUAL_CREATE", resource: "order", resourceId: runner.order.id, description: `Manual order ${runner.order.orderNumber} for ${amountMinor / 100}`, ip: getClientIp(req), userAgent: req.headers.get("user-agent") });

  if (status === "paid") {
    await fulfillOrder(runner.order.id, { adminId: ctx.user.id });
  }

  return NextResponse.json({ ok: true, id: runner.order.id, orderNumber: runner.order.orderNumber });
}
