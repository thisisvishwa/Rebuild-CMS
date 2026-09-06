import { createCheckoutSchema } from "@/lib/validation";
import { createOrder } from "@/lib/orders";
import { errorResponse, parseBody, enforceRateLimit, getIp } from "@/lib/api";
import { isDemoMode, availablePaymentMethods } from "@/lib/config";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/checkout
 * Creates a pending order ("checkout session") from the customer's contact
 * details and chosen payment method, and returns the info the client needs to
 * begin payment. The order is not considered paid until server-side
 * verification completes.
 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req, `checkout:${getIp(req)}`);
  if (rl.limited) return rl.response;

  try {
    const input = await parseBody(req, createCheckoutSchema);
    const method = input.method ?? "razorpay";

    const order = await createOrder({
      name: input.name,
      email: input.email,
      country: input.country ?? "",
      method,
    });

    await prisma.paymentEvent.create({
      data: {
        orderId: order.id,
        provider: method,
        eventType: "ORDER_CREATED",
        payload: JSON.stringify({
          orderNumber: order.orderNumber,
          amountMinor: order.amountMinor,
          currency: order.currency,
        }),
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountMinor: order.amountMinor,
        currency: order.currency,
        method,
        isDemo: isDemoMode(),
        availableMethods: availablePaymentMethods(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    return errorResponse(err, "checkout-create");
  }
}
