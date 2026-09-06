import { prisma } from "@/lib/prisma";
import { capturePaypalOrder } from "@/lib/payments/paypal";
import { completeOrder, recordEvent } from "@/lib/orders";
import { getIp, enforceRateLimit } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

const base = () => config.app.url;

/**
 * GET /api/payments/paypal/return
 * PayPal redirects here after approval (checkout flow). We capture the order
 * server-side and, only if completed, mark the order paid and send the customer
 * to the success page. Never trust a client-side confirmation.
 */
export async function GET(req: NextRequest) {
  const rl = enforceRateLimit(req, `pp-return:${getIp(req)}`);
  if (rl.limited) return rl.response;

  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/payment/failed?method=paypal", base()),
    );
  }

  try {
    // Find the order by the PayPal order id we stored at creation time.
    const order = await prisma.order.findFirst({
      where: { providerReference: token },
    });

    if (!order) {
      return NextResponse.redirect(
        new URL("/payment/failed?method=paypal", base()),
      );
    }

    const capture = await capturePaypalOrder(token);
    if (!capture.captured) {
      await recordEvent(order.id, "paypal", "PAYMENT_NOT_CAPTURED", capture);
      return NextResponse.redirect(
        new URL("/payment/failed?method=paypal&order=" + order.id, base()),
      );
    }

    await recordEvent(order.id, "paypal", "CAPTURE_SUCCESS", capture);
    const result = await completeOrder(order.id);

    const url = new URL("/payment/success", base());
    url.searchParams.set("method", "paypal");
    url.searchParams.set("order", result.order.id);
    return NextResponse.redirect(url.toString(), 302);
  } catch (err) {
    console.error("paypal return error:", err);
    if (req.nextUrl.searchParams.get("method") === "paypal") {
      return NextResponse.redirect(
        new URL("/payment/failed?method=paypal", base()),
      );
    }
    return NextResponse.redirect(
      new URL("/payment/failed?method=paypal", base()),
    );
  }
}
