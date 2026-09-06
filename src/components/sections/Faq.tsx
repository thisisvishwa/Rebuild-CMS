"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { faq, faqSection } from "@/content/faq";
import { useStorefront } from "@/components/storefront/StorefrontProvider";
import { cn } from "@/lib/utils";

function toFaqItem(f: { question: string; answer: string }): { q: string; a: string } {
  return { q: f.question, a: f.answer };
}

/** Minimal inline bold renderer for `**text**` markers in FAQ answers. */
function rich(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-charcoal-900">{part}</strong> : part,
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const store = useStorefront();
  const items = store.faqs.length ? store.faqs.map(toFaqItem) : faq;

  return (
    <section id="faq" className="bg-gradient-to-b from-cream-100 to-cream-50 py-20 sm:py-24">
      <div className="container-medium">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{faqSection.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {faqSection.headline}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-600">{faqSection.intro}</p>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-cream-200 rounded-3xl border border-cream-200 bg-white shadow-card">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={(i % 4) * 40}>
                <div>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="font-serif text-lg font-semibold text-charcoal-900">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-charcoal-400 transition-transform duration-300",
                          isOpen && "rotate-180 text-gold-600",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm leading-relaxed text-charcoal-600">
                        {rich(item.a)}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <div className="mt-10 text-center">
            <Link href="/contact" className="link-underline">
              {faqSection.contactCta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
