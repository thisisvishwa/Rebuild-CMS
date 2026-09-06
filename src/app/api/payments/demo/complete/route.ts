import { completeOrder, recordEvent } from "@/lib/orders";
import { errorResponse, parseBody, enforceRateLimit, getIp } from "@/lib/api";
import { demoCompleteSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payments/demo/complete
 * Simulated "success" used ONLY when PAYMENT_MODE="demo", so the entire funnel
 * (checkout → success → access → download) can be tested with no credentials.
 * It is gated so it cannot grant access outside of demo mode.
 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req, `demo:${getIp(req)}`);
  if (rl.limited) return rl.response;

  // Always refuse outside of demo — never grant access on a real order.
  if (process.env.PAYMENT_MODE !== "demo") {
    return new Response(
      JSON.stringify({ ok: false, error: "Demo checkout is disabled." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { orderId } = await parseBody(req, demoCompleteSchema);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return new Response(JSON.stringify({ ok: false, error: "Order not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // In demo, a "paid" order may already be granted; if not, mark it paid.
    const result = await completeOrder(order.id);
    await recordEvent(order.id, "demo", "DEMO_PAYMENT_APPROVED", {});

    return new Response(
      JSON.stringify({
        ok: true,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        accessUrl: `/payment/success?order=${encodeURIComponent(result.order.id)}&method=demo`,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err, "demo-complete");
  }
}
