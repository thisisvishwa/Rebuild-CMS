import { prisma } from "@/lib/prisma";
import {
  verifyRazorpaySignature,
  confirmRazorpayPayment,
  recordPaymentEvent,
} from "@/lib/payments/razorpay";
import { completeOrder } from "@/lib/orders";
import { errorResponse, parseBody, enforceRateLimit, getIp } from "@/lib/api";
import { razorpayVerifySchema } from "@/lib/validation";
import { isDemoMode } from "@/lib/config";
import { signAccessToken, buildAccessUrl } from "@/lib/access";

/**
 * POST /api/payments/razorpay/verify
 * Server-side verification after the Razorpay hosted checkout. We never trust a
 * client "success" message. We:
 *  1. verify the HMAC signature (order_id|payment_id signed with the key secret)
 *  2. re-confirm the payment status with Razorpay
 *  3. only then mark the order paid and grant access.
 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req, `rzp-verify:${getIp(req)}`);
  if (rl.limited) return rl.response;

  try {
    const v = await parseBody(req, razorpayVerifySchema);

    const order = await prisma.order.findUnique({ where: { id: v.orderId } });
    if (!order) {
      return new Response(JSON.stringify({ ok: false, error: "Order not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Signature check (skipped only in demo mode).
    let valid = true;
    if (!isDemoMode()) {
      valid = verifyRazorpaySignature({
        razorpayOrderId: v.razorpayOrderId,
        razorpayPaymentId: v.razorpayPaymentId,
        razorpaySignature: v.razorpaySignature,
      });
    }
    if (!valid) {
      await recordPaymentEvent(order.id, "VERIFY_FAILED", v);
      return new Response(
        JSON.stringify({ ok: false, error: "Payment verification failed. Your card was not charged." }),
        { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
      );
    }

    // Confirm actual capture status.
    const status = await confirmRazorpayPayment(v.razorpayPaymentId);
    if (!status.captured) {
      await recordPaymentEvent(order.id, "PAYMENT_NOT_CAPTURED", status);
      return new Response(
        JSON.stringify({ ok: false, error: "Payment was not completed. No charge was made." }),
        { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
      );
    }

    const result = await completeOrder(order.id);
    await recordPaymentEvent(order.id, "VERIFY_SUCCESS", {
      razorpayOrderId: v.razorpayOrderId,
      razorpayPaymentId: v.razorpayPaymentId,
    });

    const token = await signAccessToken({
      orderNumber: result.order.orderNumber,
      email: result.order.email,
    });
    const accessUrl = buildAccessUrl(token);

    return new Response(
      JSON.stringify({
        ok: true,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        accessUrl,
        already: result.already,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err, "razorpay-verify");
  }
}
