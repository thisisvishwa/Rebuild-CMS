import { prisma } from "@/lib/prisma";
import { buildWiseInstructions } from "@/lib/payments/wise";
import { errorResponse, enforceRateLimit, getIp } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ orderId: z.string().min(1) });

/**
 * GET /api/payments/wise/info?orderId=...
 * Returns the payment instructions for a (paid or pending) Wise order, including
 * the unique order reference the customer should include with their transfer.
 */
export async function GET(req: Request) {
  const rl = enforceRateLimit(req, `wise-info:${getIp(req)}`);
  if (rl.limited) return rl.response;

  try {
    const url = new URL(req.url);
    const parsed = schema.safeParse({ orderId: url.searchParams.get("orderId") });
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: "Missing order id." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
    if (!order) {
      return new Response(JSON.stringify({ ok: false, error: "Order not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const instructions = buildWiseInstructions(order.orderNumber);
    return new Response(
      JSON.stringify({
        ok: true,
        amountMinor: order.amountMinor,
        currency: order.currency,
        orderNumber: order.orderNumber,
        ...instructions,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err, "wise-info");
  }
}
