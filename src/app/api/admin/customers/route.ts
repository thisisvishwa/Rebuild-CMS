import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";

/** GET /api/admin/customers — filtered/paginated customer list. */
export async function GET(req: Request) {
  await requirePermission("customers:view");
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const per = Number(url.searchParams.get("per") ?? 16);
  const q = url.searchParams.get("q") ?? "";

  const where: any = {};
  if (q) where.OR = [{ email: { contains: q } }, { name: { contains: q } }];

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * per,
      take: per,
      include: { _count: { select: { orders: true, entitlements: true, downloads: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    items: items.map((c) => ({
      id: c.id, name: c.name, email: c.email, country: c.country,
      orders: c._count.orders, entitlements: c._count.entitlements,
      downloads: c._count.downloads, createdAt: c.createdAt,
    })),
    total, page, pages: Math.ceil(total / per),
  });
}
