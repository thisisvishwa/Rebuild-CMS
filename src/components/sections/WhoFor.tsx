import { Reveal } from "@/components/Reveal";
import { whoFor, whoNotFor } from "@/content/landing";

export function WhoFor() {
  return (
    <section id="who-for" className="bg-gradient-to-b from-cream-50 to-cream-100 py-20 sm:py-24">
      <div className="container-wide">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{whoFor.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {whoFor.headline}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* For you */}
          <Reveal>
            <div className="h-full rounded-3xl border border-cream-200 bg-white p-7 shadow-card">
              <h3 className="font-serif text-2xl font-semibold text-charcoal-900">Made for you</h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {whoFor.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-200 text-sage-600">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm leading-relaxed text-charcoal-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Not for you */}
          <Reveal delay={120}>
            <div className="h-full rounded-3xl border border-cream-200 bg-cream-100 p-7 shadow-card">
              <h3 className="font-serif text-2xl font-semibold text-charcoal-900">
                {whoNotFor.headline}
              </h3>
              <ul className="mt-5 space-y-3">
                {whoNotFor.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clay-200 text-clay-500">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="text-sm leading-relaxed text-charcoal-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl bg-white/60 p-4 text-xs leading-relaxed text-charcoal-600">
                {whoNotFor.note}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
