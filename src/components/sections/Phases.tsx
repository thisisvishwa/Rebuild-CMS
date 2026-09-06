import { Reveal } from "@/components/Reveal";
import { phases } from "@/content/landing";

/**
 * "What's inside" — the 8-phase recovery journey drawn as a calm timeline.
 * A left rail and gently alternating cards keep it legible on mobile (stacked)
 * and desktop (two-column zig-zag).
 */
export function Phases() {
  return (
    <section id="inside" className="bg-gradient-to-b from-cream-100 to-cream-50 py-20 sm:py-24">
      <div className="container-wide">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{phases.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {phases.headline}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-600">{phases.intro}</p>
        </Reveal>

        <div className="relative mx-auto mt-14 max-w-3xl">
          {/* vertical rail */}
          <div
            aria-hidden="true"
            className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-gradient-to-b from-gold-300 via-cream-300 to-sage-300 sm:left-1/2 sm:-translate-x-px"
          />

          <ol className="space-y-8">
            {phases.items.map((phase, i) => {
              const even = i % 2 === 0;
              return (
                <li key={phase.n} className="relative">
                  <Reveal delay={i * 40}>
                    <div
                      className={`flex items-start gap-4 sm:w-1/2 ${
                        even ? "sm:pr-10" : "sm:ml-auto sm:flex-row-reverse sm:pl-10 sm:text-left"
                      }`}
                    >
                      {/* node */}
                      <div className="relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-300 bg-cream-50 font-serif text-sm font-semibold text-gold-700 shadow-sm">
                        {phase.n}
                      </div>

                      <div className="flex-1 rounded-2xl border border-cream-200 bg-white p-5 shadow-card transition-transform duration-300 hover:-translate-y-1">
                        <h3 className="font-serif text-xl font-semibold text-charcoal-900">
                          {phase.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-charcoal-600">
                          {phase.text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
