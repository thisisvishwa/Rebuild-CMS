import { Reveal } from "@/components/Reveal";
import { howItWorks } from "@/content/landing";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream-50 py-20 sm:py-24">
      <div className="container-wide">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{howItWorks.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            {howItWorks.headline}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-600">{howItWorks.intro}</p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {howItWorks.steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 100}>
              <div className="relative h-full rounded-3xl border border-cream-200 bg-white p-7 text-center shadow-card">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-serif text-xl font-semibold text-white shadow-gold">
                  {step.n}
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold text-charcoal-900">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-charcoal-600">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
