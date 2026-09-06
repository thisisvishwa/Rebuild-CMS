"use client";

import { Reveal } from "@/components/Reveal";
import { ButtonLink } from "@/components/Button";
import { whatYouGet } from "@/content/landing";
import { useStorefront } from "@/components/storefront/StorefrontProvider";

export function WhatYouGet() {
  const store = useStorefront();
  const features = store.product?.features?.length ? store.product.features : whatYouGet.features;

  return (
    <section className="bg-cream-50 py-20 sm:py-24">
      <div className="container-wide">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{whatYouGet.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {whatYouGet.headline}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-600">
            {whatYouGet.intro}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 80}>
              <div className="group h-full rounded-2xl border border-cream-200 bg-white p-6 shadow-card transition-transform duration-300 hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-200 text-gold-700 transition-colors group-hover:bg-gold-200">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-charcoal-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-600">{feature.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-12 text-center">
            <ButtonLink href="/checkout" variant="primary" size="lg">
              Get the eBook
            </ButtonLink>
            <p className="mt-3 text-xs text-charcoal-400">{whatYouGet.note}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
