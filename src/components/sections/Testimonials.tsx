"use client";

import { Reveal } from "@/components/Reveal";
import { testimonials as bundled, testimonialSectionCopy } from "@/content/testimonials";
import { useStorefront } from "@/components/storefront/StorefrontProvider";

/**
 * Testimonials section.
 *
 * Reads CMS-managed testimonials (published with permission) via the storefront
 * API, falling back to `src/content/testimonials.ts`. We do not fabricate
 * reviews — when the list is empty we show an honest placeholder.
 */
export function Testimonials() {
  const store = useStorefront();
  const testimonials = store.testimonials.length ? store.testimonials : bundled;
  const empty = testimonials.length === 0;

  return (
    <section id="testimonials" className="bg-gradient-to-b from-cream-50 to-cream-100 py-20 sm:py-24">
      <div className="container-wide">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{testimonialSectionCopy.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {testimonialSectionCopy.headline}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-600">
            {testimonialSectionCopy.intro}
          </p>
        </Reveal>

        {empty ? (
          <Reveal delay={120}>
            <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-dashed border-cream-300 bg-white/70 p-10 text-center shadow-card">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-gold-600">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
                  <path d="M8 12h8M9 8h6M7 16h8M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-5 font-serif text-2xl italic leading-snug text-charcoal-700">
                {testimonialSectionCopy.placeholder}
              </p>
              <p className="mt-4 text-sm text-charcoal-500">
                We publish only genuine, permission-provided customer experiences.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name + t.quote} delay={i * 80}>
                <figure className="h-full rounded-3xl border border-cream-200 bg-white p-6 shadow-card">
                  <blockquote className="font-serif text-lg italic leading-relaxed text-charcoal-800">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-200 font-serif text-lg font-semibold text-gold-700">
                      {t.name.charAt(0)}
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold text-charcoal-800">{t.name}</span>
                      {t.situation && <span className="block text-charcoal-500">{t.situation}</span>}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
