import { ButtonLink } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { finalCta } from "@/content/landing";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 py-24 text-cream-50 sm:py-28">
      {/* new-beginning sunrise glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-sunrise-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl"
      />

      <div className="container-wide relative text-center">
        <Reveal>
          <p className="eyebrow text-gold-300">{finalCta.eyebrow}</p>
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-cream-50 sm:text-5xl lg:text-6xl">
            {finalCta.headline}
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-cream-100/85">
            {finalCta.subhead}
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/checkout" variant="gold" size="lg" className="w-full sm:w-auto">
              {finalCta.primaryCta}
            </ButtonLink>
            <ButtonLink href="/checkout" variant="light" size="lg" className="w-full sm:w-auto">
              {finalCta.secondaryCta}
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <p className="mt-6 text-sm text-cream-100/60">
            Instant digital access · Read anywhere · Private &amp; self-paced
          </p>
        </Reveal>
      </div>
    </section>
  );
}
