import { Reveal } from "@/components/Reveal";
import { problem } from "@/content/landing";

export function EmotionalProblem() {
  return (
    <section id="problem" className="bg-cream-50 py-20 sm:py-24">
      <div className="container-medium">
        <Reveal className="text-center">
          <p className="eyebrow">{problem.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {problem.headline}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-charcoal-600">
            {problem.intro}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problem.items.map((item, i) => (
            <Reveal key={item} delay={(i % 3) * 90}>
              <div className="group flex h-full items-start gap-3 rounded-2xl border border-cream-200 bg-white/70 p-5 text-left shadow-card transition-transform duration-300 hover:-translate-y-1">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-200 text-charcoal-500 group-hover:bg-gold-200 group-hover:text-gold-700">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="text-sm leading-relaxed text-charcoal-700">{item}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border-l-4 border-gold-400 bg-cream-100 p-6 text-sm leading-relaxed text-charcoal-700">
            <p>
              <span className="font-serif text-lg italic text-charcoal-900">A gentle note:</span>{" "}
              {problem.note}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
