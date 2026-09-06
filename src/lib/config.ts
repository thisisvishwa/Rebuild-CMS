/**
 * Central application configuration.
 *
 * Every runtime/tunable value in the project is resolved here from environment
 * variables so that product name, price, payment credentials, email, delivery,
 * analytics and rate limiting can all be changed at deploy time — *without
 * rebuilding the site*.
 *
 * Constant marketing copy (FAQ, testimonials, phases, legal text) lives in
 * `src/content/*` so it is equally easy to edit.
 *
 * IMPORTANT: The `PAYMENT_MODE` flag is the master switch. When it is "demo"
 * no live payment credentials are required and the purchase flow is simulated
 * so the entire funnel can be tested. Set it to "live" in production.
 */

export type PaymentMode = "demo" | "live";
export type EmailTransport = "console" | "smtp";
export type AnalyticsProvider = "none" | "ga";
export type WiseFlow = "manual" | "automated";

function readInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export const config = {
  app: {
    url: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    productName: process.env.PRODUCT_NAME ?? "Rebuild",
  },

  price: {
    amountMinor: readInt(process.env.PRODUCT_PRICE_AMOUNT, 4900),
    currency: process.env.PRODUCT_PRICE_CURRENCY?.toUpperCase() ?? "USD",
    display: process.env.NEXT_PUBLIC_PRICE_DISPLAY ?? "$49",
  },

  payment: {
    mode: (process.env.PAYMENT_MODE ?? "demo") as PaymentMode,
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID ?? "",
      keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID ?? "",
      clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
      env: (process.env.PAYPAL_ENV ?? "sandbox") as "sandbox" | "live",
    },
    wise: {
      flow: (process.env.WISE_PAYMENT_FLOW ?? "manual") as WiseFlow,
      beneficiaryName: process.env.WISE_BENEFICIARY_NAME ?? "",
      accountNumber: process.env.WISE_ACCOUNT_NUMBER ?? "",
      bankName: process.env.WISE_BANK_NAME ?? "",
      iban: process.env.WISE_IBAN ?? "",
      swift: process.env.WISE_SWIFT ?? "",
      instructions: process.env.WISE_INSTRUCTIONS ?? "",
    },
  },

  email: {
    transport: (process.env.EMAIL_TRANSPORT ?? "console") as EmailTransport,
    from: process.env.EMAIL_FROM ?? "Rebuild <support@example.com>",
    support: process.env.EMAIL_SUPPORT ?? "support@example.com",
    smtp: {
      host: process.env.SMTP_HOST ?? "",
      port: readInt(process.env.SMTP_PORT, 587),
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
      secure: readBool(process.env.SMTP_SECURE, false),
    },
  },

  delivery: {
    ebookUrl: process.env.EBOOK_DOWNLOAD_URL ?? "",
    secure: readBool(process.env.SECURE_DOWNLOAD, true),
    downloadTtl: readInt(process.env.DOWNLOAD_LINK_TTL, 900),
    accessSecret:
      process.env.ACCESS_TOKEN_SECRET ?? "insecure-development-secret-change-me",
  },

  analytics: {
    provider: (process.env.ANALYTICS_PROVIDER ?? "none") as AnalyticsProvider,
    gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  },

  security: {
    rateLimitWindowMs: readInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    rateLimitMax: readInt(process.env.RATE_LIMIT_MAX, 30),
  },
} as const;

/** True when the checkout should be simulated (no live processors). */
export const isDemoMode = () => config.payment.mode === "demo";

/** The canonical list of enabled payment methods for the current config. */
export type PaymentMethod = "razorpay" | "paypal" | "wise";

export function availablePaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = [];
  // All three are always offered; in demo mode they are simulated, in live mode
  // they require the matching credentials (validated at checkout time).
  methods.push("razorpay", "paypal", "wise");
  return methods;
}

export function isPaymentMethodConfigured(method: PaymentMethod): boolean {
  if (isDemoMode()) return true;
  switch (method) {
    case "razorpay":
      return Boolean(config.payment.razorpay.keyId && config.payment.razorpay.keySecret);
    case "paypal":
      return Boolean(config.payment.paypal.clientId && config.payment.paypal.clientSecret);
    case "wise":
      return true; // manual flow has no shared secret
    default:
      return false;
  }
}

export type AppConfig = typeof config;
