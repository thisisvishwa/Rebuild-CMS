import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, recordPaymentEvent, razorpayReceipt } from "@/lib/payments/razorpay";
import { errorResponse, parseBody, enforceRateLimit, getIp } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ orderId: z.string().min(1) });

/**
 * POST /api/payments/razorpay/create
 * Creates a Razorpay order for a pending order so the hosted checkout can open.
 * Returns the public Razorpay key and the Razorpay order id (safe for the client).
 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req, `rzp-create:${getIp(req)}`);
  if (rl.limited) return rl.response;

  try {
    const { orderId } = await parseBody(req, schema);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return new Response(JSON.stringify({ ok: false, error: "Order not found." }), { status: 404, headers: { "Content-Type": "application/json" } });

    const rp = await createRazorpayOrder(order.email, razorpayReceipt());
    await recordPaymentEvent(orderId, "RAZORPAY_ORDER_CREATED", rp);

    return new Response(
      JSON.stringify({
        ok: true,
        razorpayOrderId: rp.orderId,
        keyId: rp.keyId,
        amountMinor: rp.amountMinor,
        currency: rp.currency,
        isDemo: rp.demo,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err, "razorpay-create");
  }
}
