import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { config } from "@/lib/config";

/** GET /api/admin/checkout — checkout configuration + live funnel state. */
export async function GET() {
  await requirePermission("orders:view");
  const providers = await prisma.paymentProvider.findMany({ select: { key: true, name: true, enabled: true, showOnCheckout: true, environment: true } });
  const abandonedOrders = await prisma.order.count({ where: { status: "pending" } });
  const failedPayments = await prisma.payment.count({ where: { status: { in: ["failed", "cancelled"] } } });
  const paidOrders = await prisma.order.count({ where: { status: "paid" } });
  const taxSetting = await prisma.systemSetting.findUnique({ where: { key: "commerce.taxEnabled" } });
  const priceSetting = await prisma.systemSetting.findUnique({ where: { key: "commerce.priceMinor" } });
  const currency = await prisma.systemSetting.findUnique({ where: { key: "commerce.currency" } });

  return NextResponse.json({
    ok: true,
    config: {
      paymentMode: config.payment.mode,
      priceMinor: Number(priceSetting?.value ?? config.price.amountMinor),
      currency: currency?.value ?? config.price.currency,
      taxEnabled: taxSetting?.value === "true",
      productName: config.app.productName,
      providers,
    },
    stats: { abandonedOrders, failedPayments, paidOrders },
  });
}
