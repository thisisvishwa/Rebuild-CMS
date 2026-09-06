import { prisma } from "@/lib/prisma";
import { createPaypalOrder } from "@/lib/payments/paypal";
import { recordEvent } from "@/lib/orders";
import { errorResponse, parseBody, enforceRateLimit, getIp } from "@/lib/api";
import { config } from "@/lib/config";
import { z } from "zod";

const schema = z.object({ orderId: z.string().min(1) });

/**
 * POST /api/payments/paypal/create
 * Creates a PayPal order for a pending order and returns the approval URL the
 * customer is sent to. Stores the PayPal order id on our order so the return
 * callback can be matched & captured server-side.
 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req, `pp-create:${getIp(req)}`);
  if (rl.limited) return rl.response;

  try {
    const { orderId } = await parseBody(req, schema);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return new Response(JSON.stringify({ ok: false, error: "Order not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (order.status === "paid") {
      return new Response(
        JSON.stringify({ ok: true, alreadyPaid: true, orderId: order.id }),
        { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
      );
    }

    const result = await createPaypalOrder({
      amountMinor: order.amountMinor,
      currency: order.currency,
      returnUrl: `${config.app.url}/api/payments/paypal/return`,
      cancelUrl: `${config.app.url}/payment/failed?method=paypal`,
      reference: order.orderNumber,
    });

    // Store the PayPal order id so the return callback can find this order.
    await prisma.order.update({
      where: { id: order.id },
      data: { providerReference: result.orderId },
    });
    await recordEvent(order.id, "paypal", "PAYPAL_ORDER_CREATED", { paypalOrderId: result.orderId });

    return new Response(
      JSON.stringify({ ok: true, approveUrl: result.approveUrl, isDemo: result.demo }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err, "paypal-create");
  }
}
