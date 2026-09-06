import { randomUUID } from "node:crypto";
import { config, isDemoMode } from "@/lib/config";
import { sleep } from "@/lib/utils";

/**
 * PayPal integration (server-side, redirect flow).
 *
 * Flow:
 *  1. We create a PayPal order (intent = CAPTURE) with a return/cancel URL.
 *  2. We redirect the customer to PayPal's approval link.
 *  3. After approval PayPal redirects back with an order token/id.
 *  4. We capture the order and verify it is COMPLETED before granting access.
 *
 * No client SDK is required, and no private credentials ever reach the browser.
 * When PAYMENT_MODE="demo", the flow is simulated so it can be tested locally.
 */

const base = () => {
  if (isDemoMode()) return "";
  return config.payment.paypal.env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

async function getAccessToken(): Promise<string> {
  if (isDemoMode()) return "demo-token";
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${config.payment.paypal.clientId}:${config.payment.paypal.clientSecret}`,
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal auth failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface PaypalCreateResult {
  orderId: string;
  approveUrl: string;
  demo: boolean;
}

export async function createPaypalOrder(params: {
  amountMinor: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  reference: string;
}): Promise<PaypalCreateResult> {
  if (isDemoMode()) {
    await sleep(250);
    const orderId = `PP-${randomUUID().replace(/-/g, "").slice(0, 18)}`;
    return {
      orderId,
      approveUrl: `${params.returnUrl}?method=paypal&token=${encodeURIComponent(orderId)}`,
      demo: true,
    };
  }

  const token = await getAccessToken();
  const amount = (params.amountMinor / 100).toFixed(2);

  const res = await fetch(`${base()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.reference,
          amount: { currency_code: params.currency, value: amount },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW",
        brand_name: config.app.productName,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal order creation failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    id: string;
    links: { rel: string; href: string }[];
  };
  const approve = data.links.find((l) => l.rel === "approve");
  if (!approve) {
    throw new Error("PayPal did not return an approval link");
  }
  return { orderId: data.id, approveUrl: approve.href, demo: false };
}

export interface PaypalCaptureResult {
  captured: boolean;
  status: string;
  transactionId?: string;
}

export async function capturePaypalOrder(
  paypalOrderId: string,
): Promise<PaypalCaptureResult> {
  if (isDemoMode()) {
    await sleep(300);
    return {
      captured: true,
      status: "COMPLETED",
      transactionId: `PAY-${randomUUID().replace(/-/g, "").slice(0, 18)}`,
    };
  }

  const token = await getAccessToken();
  const res = await fetch(`${base()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal capture failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    status: string;
    purchase_units?: { payments?: { captures?: { id: string }[] } }[];
  };

  const captured = data.status === "COMPLETED";
  const transactionId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  return { captured, status: data.status, transactionId };
}
