import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { buildAccessUrlForOrder } from "@/lib/email";
import { resolveActivePricing } from "@/lib/pricing";
import { fulfillOrder } from "@/lib/admin/fulfillment";

/**
 * Order lifecycle helpers.
 *
 * All payment providers funnel through this module so the post-payment side
 * effects (mark paid → grant access → send emails) are implemented once and
 * idempotently.
 */

export interface CreateOrderInput {
  name: string;
  email: string;
  country: string;
  method: "razorpay" | "paypal" | "wise" | "demo";
}

export async function createOrder(input: CreateOrderInput) {
  // Backend is the single source of truth: resolve product + authoritative price.
  const pricing = await resolveActivePricing();

  // Resolve the active, non-archived product version so the order line item can
  // carry a versionId (what the customer is actually entitled to download).
  const product = await prisma.product.findFirst({
    where: { isActive: true, isArchived: false },
    include: { versions: { where: { status: "active" }, orderBy: { uploadedAt: "desc" }, take: 1 } },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      productId: pricing.productId,
      productName: pricing.productName,
      baseAmountMinor: pricing.baseMinor,
      amountMinor: pricing.totalMinor,
      taxMinor: pricing.taxMinor,
      currency: pricing.currency,
      method: input.method,
      name: input.name,
      email: input.email.toLowerCase().trim(),
      country: input.country,
      status: "pending",
      items: {
        create: {
          productId: pricing.productId,
          title: pricing.productName,
          quantity: 1,
          unitPriceMinor: pricing.totalMinor,
          versionId: product?.versions?.[0]?.id ?? null,
        },
      },
    },
  });
  return order;
}

export async function findOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({ where: { orderNumber } });
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({ where: { id } });
}

/**
 * Mark an order as paid and grant access, idempotently. If the order was
 * already paid, it is returned as-is so that duplicate callbacks don't double
 * side-effects.
 *
 * Returns the access URL so callers can send the customer straight to it.
 */
export async function completeOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  // If already paid and fulfilled, return idempotently.
  if (order.status === "paid" && order.accessGranted) {
    const alreadyFulfilled = await prisma.invoice.findUnique({ where: { orderId } });
    if (alreadyFulfilled) {
      const accessUrl = await buildAccessUrlForOrder({ orderNumber: order.orderNumber, email: order.email });
      return { order, already: true, accessUrl };
    }
  }

  // Mark paid + grant access.
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "paid", paidAt: new Date(), accessGranted: true },
  });

  // Run the full idempotent fulfillment pipeline (customer, invoice,
  // entitlement, template emails, analytics, notification, audit).
  const fulfilled = await fulfillOrder(orderId, { notify: true });
  return { order: updated, already: false, accessUrl: fulfilled.accessUrl };
}

/** Record a provider payment event (audit trail + debugging). */
export async function recordEvent(
  orderId: string,
  provider: string,
  eventType: string,
  payload: unknown,
) {
  await prisma.paymentEvent.create({
    data: {
      orderId,
      provider,
      eventType,
      payload: JSON.stringify(payload),
    },
  });
}


