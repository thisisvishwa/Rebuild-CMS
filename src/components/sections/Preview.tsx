import { Reveal } from "@/components/Reveal";
import { BookCover } from "@/components/BookCover";
import { preview } from "@/content/landing";

export function Preview() {
  return (
    <section id="preview" className="bg-cream-50 py-20 sm:py-24">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative mx-auto w-full max-w-sm">
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-full bg-gradient-to-tr from-sunrise-200/40 to-sage-200/40 blur-3xl"
              />
              <BookCover className="relative" />
            </div>
          </Reveal>

          <div>
            <Reveal>
              <p className="eyebrow">{preview.eyebrow}</p>
              <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl">
                {preview.headline}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-charcoal-600">{preview.intro}</p>
            </Reveal>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {preview.items.map((item, i) => (
                <Reveal key={item.title} delay={i * 60}>
                  <div className="h-full rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
                    <h3 className="font-serif text-lg font-semibold text-charcoal-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-charcoal-600">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
