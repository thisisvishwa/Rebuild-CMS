import { Reveal } from "@/components/Reveal";
import { transformation } from "@/content/landing";
import { cn } from "@/lib/utils";

export function Transformation() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 to-cream-100 py-20 sm:py-24">
      <div className="container-wide">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{transformation.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {transformation.headline}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-600">
            {transformation.subhead}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Before */}
          <Reveal delay={80}>
            <div className="h-full rounded-3xl border border-charcoal-100 bg-charcoal-900 p-7 text-cream-100 shadow-lift">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-cream-50/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cream-100/80">
                  {transformation.beforeTitle}
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                {transformation.before.map((item) => (
                  <li key={item.title} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-0">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-50/10 text-cream-100/60">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-serif text-lg font-semibold text-cream-50">{item.title}</p>
                      <p className="text-sm text-cream-100/70">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* After */}
          <Reveal delay={160}>
            <div className="h-full rounded-3xl border border-gold-200 bg-gradient-to-br from-cream-50 to-sunrise-50 p-7 shadow-card">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gold-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {transformation.afterTitle}
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                {transformation.after.map((item) => (
                  <li key={item.title} className="flex items-start gap-3 border-b border-gold-200/60 pb-3 last:border-0">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-200 text-gold-700">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <p className={cn("font-serif text-lg font-semibold text-charcoal-900")}>{item.title}</p>
                      <p className="text-sm text-charcoal-600">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-charcoal-500">
            {transformation.disclaimer}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
