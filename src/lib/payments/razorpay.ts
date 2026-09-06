import crypto from "node:crypto";
import { config, isDemoMode } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, sleep } from "@/lib/utils";

/**
 * Razorpay integration (server-side).
 *
 * Flow:
 *  1. We create an order on Razorpay (amount + currency + receipt).
 *  2. The checkout opens Razorpay's hosted checkout using the public key & order id
 *     — card details never touch our servers.
 *  3. After payment, the client returns payment_id, order_id, signature.
 *  4. We verify the HMAC-SHA256 signature server-side and re-check the payment
 *     status with Razorpay before granting access.
 *
 * When PAYMENT_MODE="demo", no live credentials are used and the flow is
 * simulated so the entire funnel can be tested locally.
 */

const API_BASE = "https://api.razorpay.com/v1";

const auth = () =>
  Buffer.from(
    `${config.payment.razorpay.keyId}:${config.payment.razorpay.keySecret}`,
  ).toString("base64");

export interface RazorpayCreateResult {
  orderId: string;
  amountMinor: number;
  currency: string;
  keyId: string;
  demo: boolean;
}

export async function createRazorpayOrder(
  email: string,
  receipt: string,
): Promise<RazorpayCreateResult> {
  const { amountMinor, currency } = config.price;

  if (isDemoMode()) {
    // Simulate a small delay for realism and return a fake order id.
    await sleep(250);
    return {
      orderId: `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
      amountMinor,
      currency,
      keyId: "rzp_demo_key",
      demo: true,
    };
  }

  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth()}`,
    },
    body: JSON.stringify({
      amount: amountMinor,
      currency,
      receipt,
      notes: { email },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return {
    orderId: data.id,
    amountMinor,
    currency,
    keyId: config.payment.razorpay.keyId,
    demo: false,
  };
}

/**
 * Verify the Razorpay checkout signature (order_id | payment_id signed with the
 * key secret). Returns true only if the signature matches.
 */
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", config.payment.razorpay.keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");
  // Constant-time comparison.
  const a = Buffer.from(expected);
  const b = Buffer.from(params.razorpaySignature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Confirm with Razorpay that a payment was actually captured. */
export async function confirmRazorpayPayment(
  paymentId: string,
): Promise<{ captured: boolean; status: string }> {
  if (isDemoMode()) {
    return { captured: true, status: "captured" };
  }
  const res = await fetch(`${API_BASE}/payments/${paymentId}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay payment fetch failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { status: string };
  const captured = data.status === "captured" || data.status === "authorized";
  return { captured, status: data.status };
}

/** Record a Razorpay payment event for audit/accounting. */
export async function recordPaymentEvent(
  orderId: string,
  eventType: string,
  payload: unknown,
) {
  await prisma.paymentEvent.create({
    data: {
      orderId,
      provider: "razorpay",
      eventType,
      payload: JSON.stringify(payload),
    },
  });
}

export const razorpayReceipt = () =>
  `receipt_${generateOrderNumber().toLowerCase()}`;
