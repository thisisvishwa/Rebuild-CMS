import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface LegalPageProps {
  title: string;
  updated?: string;
  intro?: string;
  sections: { heading: string; body: string }[];
}

/**
 * Shared shell for the legal / support pages: header, a readable content
 * column, and footer. Each page supplies its own title, intro and sections.
 */
export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <>
      <Header />
      <main className="bg-cream-50">
        <section className="container-medium py-16 sm:py-20">
          <header className="max-w-3xl">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-charcoal-900 sm:text-5xl">
              {title}
            </h1>
            {updated && (
              <p className="mt-3 text-sm text-charcoal-500">{updated}</p>
            )}
            {intro && (
              <p className="mt-6 text-lg leading-relaxed text-charcoal-600">
                {intro}
              </p>
            )}
          </header>

          <div className="mt-10 max-w-3xl space-y-8">
            {sections.map((s) => (
              <section
                key={s.heading}
                className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card sm:p-8"
              >
                <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                  {s.heading}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal-600">
                  {s.body}
                </p>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
