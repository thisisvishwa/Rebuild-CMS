import { prisma } from "@/lib/prisma";
import { completeOrder, recordEvent } from "@/lib/orders";
import { errorResponse, parseBody, enforceRateLimit, getIp } from "@/lib/api";
import { wiseSubmitSchema } from "@/lib/validation";
import { isDemoMode } from "@/lib/config";

/**
 * POST /api/payments/wise/submit
 * Records the customer's Wise payment instruction/reference (proof of payment).
 *
 * Wise has no drop-in hosted checkout, so this supports a verified "manual"
 * flow: the customer pays and submits their order/reference, then a human
 * verifies the transfer before access is granted.
 *
 * In DEMO mode we auto-approve the verification (clearly simulated) so the whole
 * funnel can be exercised locally. In LIVE mode the order stays under
 * "pending_verification" and is fulfilled after manual/automated verification —
 * we never claim automatic verification where none exists.
 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req, `wise-submit:${getIp(req)}`);
  if (rl.limited) return rl.response;

  try {
    const v = await parseBody(req, wiseSubmitSchema);
    const order = await prisma.order.findUnique({ where: { id: v.orderId } });
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

    // Store the proof-of-payment reference.
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        wiseReference: v.reference,
        wiseProofNote: v.note || null,
        status: isDemoMode() ? "pending" : "pending_verification",
        providerReference: v.reference,
      },
    });
    await recordEvent(order.id, "wise", "WISE_SUBMITTED", { reference: v.reference, note: v.note });

    // Demo mode: simulate a verified payment so the flow is testable end-to-end.
    if (isDemoMode()) {
      const result = await completeOrder(order.id);
      return new Response(
        JSON.stringify({
          ok: true,
          demo: true,
          status: "paid",
          orderId: result.order.id,
          accessUrl: `/payment/success?order=${encodeURIComponent(result.order.id)}&method=wise`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
      );
    }

    // Live mode: awaits manual verification.
    return new Response(
      JSON.stringify({
        ok: true,
        demo: false,
        status: "pending_verification",
        orderId: updated.id,
        message:
          "Your payment details have been recorded. Once your transfer is verified, we'll grant access by email.",
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err, "wise-submit");
  }
}
