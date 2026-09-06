"use client";

import { Receipt, Lock, ShieldCheck, Zap } from "lucide-react";
import { ButtonLink } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { pricing } from "@/content/landing";
import { config, availablePaymentMethods } from "@/lib/config";
import { useStorefront } from "@/components/storefront/StorefrontProvider";

const methodLabels: Record<string, string> = {
  razorpay: "Razorpay",
  paypal: "PayPal",
  wise: "Wise",
};

/** Format a minor-unit amount into a display label, e.g. 4900 -> "$49". */
function minorToDisplay(minor: number, currency: string): string {
  const whole = Math.round(minor / 100).toLocaleString("en-US");
  const symbol = currency === "USD" ? "$" : currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${whole}`;
}

export function Pricing() {
  const store = useStorefront();
  const methods = store.paymentMethods.available.length ? store.paymentMethods.available : availablePaymentMethods();
  const priceLabel =
    store.product?.price
      ? minorToDisplay(store.product.price.totalMinor, store.product.currency)
      : pricing.priceLabel;
  const productName = store.product?.name ?? config.app.productName;
  const includes = store.product?.features?.length
    ? store.product.features.map((f) => (f.text ? `${f.title} — ${f.text}` : f.title))
    : pricing.includes;

  return (
    <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50 py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-sunrise-100/50 blur-3xl"
      />
      <div className="container-wide relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{pricing.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {pricing.headline}
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-12 max-w-lg overflow-hidden rounded-4xl border border-gold-200 bg-white shadow-card">
            {/* card header */}
            <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-800 p-8 text-cream-50">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-semibold">{productName}</h3>
                <Zap className="h-5 w-5 text-gold-300" aria-hidden="true" />
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-serif text-6xl font-semibold tracking-tight">
                  {priceLabel}
                </span>
              </div>
              <p className="mt-1 text-sm uppercase tracking-[0.18em] text-cream-100/70">
                {pricing.perLabel}
              </p>
            </div>

            {/* included */}
            <div className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                {pricing.includesTitle}
              </p>
              <ul className="mt-4 grid gap-2.5">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-200 text-gold-700">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm leading-relaxed text-charcoal-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <ButtonLink href="/checkout" variant="gold" size="lg" className="w-full">
                  {pricing.cta}
                </ButtonLink>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-charcoal-500">
                <Lock className="h-3.5 w-3.5 text-gold-600" aria-hidden="true" />
                {pricing.reassuring}
              </p>

              {/* payment methods */}
              <div className="mt-6 border-t border-cream-200 pt-6">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-500">
                  Secure payment via
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                  {methods.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-cream-50 px-4 py-1.5 text-xs font-semibold text-charcoal-700"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
                      {methodLabels[m]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mx-auto mt-8 flex max-w-lg items-start gap-3 rounded-2xl border border-cream-200 bg-cream-100 p-5 text-sm text-charcoal-600">
            <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden="true" />
            <p>{pricing.guaranteeNote}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
