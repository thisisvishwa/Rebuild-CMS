import { ArrowDown, ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/Button";
import { HeroMockup } from "@/components/HeroMockup";
import { Reveal } from "@/components/Reveal";
import { hero } from "@/content/landing";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-cream-100 via-cream-50 to-cream-50"
    >
      {/* soft ambient shape */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-sage-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full bg-sunrise-100/60 blur-3xl"
      />

      <div className="container-wide relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-10 lg:py-24">
        <div className="relative z-10 text-center lg:text-left">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              {hero.eyebrow}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-charcoal-900 sm:text-5xl lg:text-6xl">
              {hero.headline}
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-charcoal-600 sm:text-lg lg:mx-0">
              {hero.subhead}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink href="/checkout" variant="primary" size="lg" className="w-full sm:w-auto">
                {hero.primaryCta}
              </ButtonLink>
              <ButtonLink
                href="#inside"
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto"
              >
                {hero.secondaryCta}
                <ChevronDown className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-charcoal-500 lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-sage-400" aria-hidden="true" />
                {hero.trustLine.split("·")[0]}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-sage-400" aria-hidden="true" />
                {hero.trustLine.split("·")[1]}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-sage-400" aria-hidden="true" />
                {hero.trustLine.split("·")[2]}
              </span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative">
          <HeroMockup />
        </Reveal>
      </div>

      <a
        href="#problem"
        className="mx-auto mb-8 block w-fit text-charcoal-400 transition-colors hover:text-charcoal-700"
        aria-label="Scroll to the next section"
      >
        <ArrowDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}
