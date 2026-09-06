"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  ShieldCheck,
  CreditCard,
  Send,
  Loader2,
  CheckCircle2,
  Info,
  Globe,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type Method = "razorpay" | "paypal" | "wise";

interface Props {
  productName: string;
  priceDisplay: string;
  currency: string;
  isDemo: boolean;
  availableMethods: Method[];
}

interface OrderSession {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  method: Method;
  isDemo: boolean;
}

interface WiseInfo {
  flow: "manual" | "automated";
  reference: string;
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  iban: string;
  swift: string;
  instructions: string;
  amountMinor: number;
  currency: string;
  orderNumber: string;
}

const methodMeta: Record<Method, { label: string; sub: string; icon: typeof CreditCard }> = {
  razorpay: { label: "Razorpay", sub: "Cards · UPI · Netbanking", icon: CreditCard },
  paypal: { label: "PayPal", sub: "PayPal balance or card", icon: Send },
  wise: { label: "Wise", sub: "International transfer", icon: Globe },
};

async function post<T = Record<string, unknown>>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

/** Load the Razorpay checkout SDK (browser only). */
function loadRazorpay(): Promise<{ open: (o: unknown) => void }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Not a browser"));
    const w = window as unknown as Record<string, unknown>;
    if (w.Razorpay) return resolve(w.Razorpay as unknown as { open: (o: unknown) => void });
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () =>
      resolve((window as unknown as Record<string, unknown>).Razorpay as unknown as { open: (o: unknown) => void });
    script.onerror = () => reject(new Error("Couldn't load the secure payment window."));
    document.body.appendChild(script);
  });
}

export function CheckoutClient({
  productName,
  priceDisplay,
  isDemo,
  availableMethods,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [method, setMethod] = useState<Method>("razorpay");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [state, setState] = useState<"form" | "wise">("form");
  const [wiseInfo, setWiseInfo] = useState<WiseInfo | null>(null);
  const [wiseOrderId, setWiseOrderId] = useState("");
  const [wiseReference, setWiseReference] = useState("");
  const [wiseNote, setWiseNote] = useState("");
  const [wiseSubmitted, setWiseSubmitted] = useState(false);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  function validate(): string {
    if (name.trim().length < 2) return "Please enter your full name.";
    if (!emailValid) return "Please enter a valid email address.";
    return "";
  }

  async function createSession(): Promise<OrderSession> {
    const data = await post<{ orderId: string; orderNumber: string; amountMinor: number; currency: string; method: Method; isDemo: boolean }>(
      "/api/checkout",
      { name, email, country, method },
    );
    return {
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      amountMinor: data.amountMinor,
      currency: data.currency,
      method,
      isDemo: data.isDemo,
    };
  }

  async function openRazorpay(order: OrderSession) {
    const rp = await post<{ razorpayOrderId: string; keyId: string; amountMinor: number; currency: string }>(
      "/api/payments/razorpay/create",
      { orderId: order.orderId },
    );
    trackEvent("checkout_initiated", { method: "razorpay" });
    const R = await loadRazorpay();
    const options = {
      key: rp.keyId,
      order_id: rp.razorpayOrderId,
      amount: rp.amountMinor,
      currency: rp.currency,
      name: productName,
      description: "Breakup & Divorce Recovery eBook",
      prefill: { name, email },
      theme: { color: "#7E6526" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await post("/api/payments/razorpay/verify", {
            orderId: order.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          trackEvent("purchase_completed", { method: "razorpay" });
          router.push(`/payment/success?order=${order.orderId}&method=razorpay`);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Payment was not verified.");
          trackEvent("error_shown", { method: "razorpay" });
        }
      },
      modal: {
        ondismiss: () => setProcessing(false),
      },
    };
    R.open(options);
  }

  async function pay() {
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setProcessing(true);
    try {
      const order = await createSession();
      trackEvent("checkout_opened", { method });

      // Demo: simulate the whole purchase end-to-end.
      if (isDemo) {
        const res = await post<{ accessUrl: string }>("/api/payments/demo/complete", {
          orderId: order.orderId,
        });
        trackEvent("purchase_completed", { method: "demo" });
        router.push(res.accessUrl);
        return;
      }

      if (method === "razorpay") {
        await openRazorpay(order);
        setProcessing(false);
      } else if (method === "paypal") {
        const pp = await post<{ approveUrl: string }>("/api/payments/paypal/create", {
          orderId: order.orderId,
        });
        trackEvent("checkout_initiated", { method: "paypal" });
        window.location.href = pp.approveUrl;
      } else if (method === "wise") {
        trackEvent("checkout_initiated", { method: "wise" });
        const info = await fetch(
          `/api/payments/wise/info?orderId=${encodeURIComponent(order.orderId)}`,
        ).then((r) => r.json());
        setWiseInfo(info as WiseInfo);
        setWiseOrderId(order.orderId);
        setWiseSubmitted(false);
        setState("wise");
        setProcessing(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setProcessing(false);
      trackEvent("error_shown", { method });
    }
  }

  async function submitWise() {
    if (!wiseInfo) return;
    if (wiseReference.trim().length < 3) {
      setError("Please enter your payment reference so we can match your transfer.");
      return;
    }
    setError("");
    setProcessing(true);
    try {
      const res = await post<{ ok: true; demo?: boolean; status: string; accessUrl?: string }>(
        "/api/payments/wise/submit",
        { orderId: wiseOrderId, name, email, country, reference: wiseReference, note: wiseNote },
      );
      if (res.accessUrl) {
        router.push(res.accessUrl);
        return;
      }
      setWiseSubmitted(true);
      trackEvent("purchase_completed", { method: "wise" });
      setProcessing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit your payment details.");
      setProcessing(false);
    }
  }

  return (
    <div className="container-wide grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_24rem]">
      {/* ORDER SUMMARY (mobile-first, sticky on desktop) */}
      <aside className="order-2 lg:order-1">
        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-card lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl font-semibold text-charcoal-900">Order summary</h2>
          <div className="mt-4 flex items-center justify-between border-b border-cream-200 pb-4">
            <div>
              <p className="font-medium text-charcoal-800">{productName}</p>
              <p className="text-sm text-charcoal-500">Digital eBook · Instant access</p>
            </div>
            <span className="font-serif text-xl font-semibold text-charcoal-900">{priceDisplay}</span>
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-charcoal-500">Total</span>
            <span className="font-serif text-2xl font-semibold text-charcoal-900">{priceDisplay}</span>
          </div>
          <p className="mt-3 text-xs text-charcoal-400">One-time payment. No subscription.</p>
          <div className="mt-5 rounded-2xl bg-cream-100 p-4">
            <p className="flex items-center gap-2 text-sm text-charcoal-700">
              <CheckCircle2 className="h-4 w-4 text-sage-500" aria-hidden="true" />
              Instant digital delivery after payment
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-charcoal-700">
              <ShieldCheck className="h-4 w-4 text-sage-500" aria-hidden="true" />
              Cards processed securely by Razorpay
            </p>
          </div>
        </div>
      </aside>

      {/* CHECKOUT FORM */}
      <div className="order-1 lg:order-2">
        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-card sm:p-8">
          {state === "form" ? (
            <>
              <div className="flex items-center justify-between">
                <h1 className="font-serif text-3xl font-semibold text-charcoal-900">Checkout</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1 text-xs font-semibold text-charcoal-600">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Secure
                </span>
              </div>

              {isDemo && (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-gold-200 bg-cream-100 p-3 text-sm text-charcoal-600">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                  Demo mode: a secure simulated payment will be used so you can
                  test the full flow. No real money is charged.
                </p>
              )}

              <div className="mt-7 space-y-4">
                <LabeledInput
                  label="Full name"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                  placeholder="Your name"
                />
                <LabeledInput
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
                <LabeledInput
                  label="Country"
                  value={country}
                  onChange={setCountry}
                  autoComplete="country-name"
                  placeholder="Country (optional)"
                  optional
                />
              </div>

              <div className="mt-8">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-charcoal-500">
                  Choose payment method
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {availableMethods.map((m) => {
                    const meta = methodMeta[m];
                    const Icon = meta.icon;
                    const active = method === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        aria-pressed={active}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                          active
                            ? "border-gold-500 bg-gold-100/50 ring-1 ring-gold-500"
                            : "border-cream-200 bg-cream-50 hover:border-charcoal-300",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            active ? "bg-gold-600 text-white" : "bg-white text-charcoal-500",
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="font-semibold text-charcoal-800">{meta.label}</span>
                        <span className="text-xs text-charcoal-500">{meta.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="mt-5 rounded-xl border border-clay-200 bg-clay-100 p-3 text-sm text-charcoal-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={pay}
                disabled={processing}
                className="btn btn-gold mt-7 w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Processing…
                  </>
                ) : (
                  <>
                    Continue to payment
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-charcoal-500">
                By continuing you agree to our{" "}
                <a href="/terms" className="link-underline">Terms</a> and{" "}
                <a href="/privacy-policy" className="link-underline">Privacy Policy</a>.
              </p>
            </>
          ) : (
            // WISE payment instructions + proof-of-payment
            <WisePanel
              wiseInfo={wiseInfo}
              submitter={submitWise}
              reference={wiseReference}
              setReference={setWiseReference}
              note={wiseNote}
              setNote={setWiseNote}
              submitted={wiseSubmitted}
              processing={processing}
              error={error}
              back={() => setState("form")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-charcoal-700">
        {label}
        {optional && <span className="ml-1 text-charcoal-400">(optional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={!optional}
        className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-charcoal-800 outline-none transition-colors focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
      />
    </label>
  );
}

function WisePanel({
  wiseInfo,
  submitter,
  reference,
  setReference,
  note,
  setNote,
  submitted,
  processing,
  error,
  back,
}: {
  wiseInfo: WiseInfo | null;
  submitter: () => void;
  reference: string;
  setReference: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  submitted: boolean;
  processing: boolean;
  error: string;
  back: () => void;
}) {
  if (!wiseInfo) return null;
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-charcoal-900">Pay with Wise</h1>
      <p className="mt-2 text-sm text-charcoal-600">{wiseInfo.instructions}</p>

      <div className="mt-5 rounded-2xl border border-cream-200 bg-cream-50 p-5">
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <dt className="text-charcoal-500">Pay to</dt>
          <dd className="font-medium text-charcoal-800">{wiseInfo.beneficiaryName}</dd>
          <dt className="text-charcoal-500">Reference</dt>
          <dd className="font-semibold text-gold-700">{wiseInfo.reference}</dd>
          <dt className="text-charcoal-500">Amount</dt>
          <dd className="font-medium text-charcoal-800">{wiseInfo.amountMinor > 0 ? `$${(wiseInfo.amountMinor / 100).toFixed(2)}` : "—"}</dd>
          {wiseInfo.iban !== "—" && (
            <>
              <dt className="text-charcoal-500">IBAN</dt>
              <dd className="font-medium text-charcoal-800">{wiseInfo.iban}</dd>
            </>
          )}
          {wiseInfo.accountNumber !== "—" && (
            <>
              <dt className="text-charcoal-500">Account</dt>
              <dd className="font-medium text-charcoal-800">{wiseInfo.accountNumber}</dd>
            </>
          )}
          {wiseInfo.bankName !== "—" && (
            <>
              <dt className="text-charcoal-500">Bank</dt>
              <dd className="font-medium text-charcoal-800">{wiseInfo.bankName}</dd>
            </>
          )}
          {wiseInfo.swift !== "—" && (
            <>
              <dt className="text-charcoal-500">SWIFT/BIC</dt>
              <dd className="font-medium text-charcoal-800">{wiseInfo.swift}</dd>
            </>
          )}
        </dl>
      </div>

      {submitted ? (
        <div className="mt-5 rounded-2xl border border-sage-200 bg-sage-50 p-5 text-sm text-charcoal-700">
          <p className="flex items-center gap-2 font-semibold text-charcoal-900">
            <CheckCircle2 className="h-5 w-5 text-sage-500" aria-hidden="true" />
            Payment details received
          </p>
          <p className="mt-2">
            Thanks — we've recorded your transfer reference. Once your payment is
            verified, your access will be emailed to you. This can take a little
            time while we confirm the transfer.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-4">
            <LabeledInput
              label="Your payment reference / order id"
              value={reference}
              onChange={setReference}
              placeholder="Paste the reference from your transfer"
            />
            <label className="block">
              <span className="text-sm font-medium text-charcoal-700">
                Note <span className="text-charcoal-400">(optional)</span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Anything to help us match your payment"
                className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-charcoal-800 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-clay-200 bg-clay-100 p-3 text-sm text-charcoal-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submitter}
            disabled={processing}
            className="btn btn-gold mt-6 w-full"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>I&apos;ve made the payment</>
            )}
          </button>
        </>
      )}

      <button type="button" onClick={back} className="mt-4 text-sm text-charcoal-500 hover:text-charcoal-800">
        ← Choose another payment method
      </button>
    </div>
  );
}
