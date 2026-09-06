import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { legalPages } from "@/content/legal";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact & Support",
  description: "We're here to help. Reach out any time.",
};

export default function ContactPage() {
  const c = legalPages.contact;
  return (
    <>
      <Header />
      <main className="bg-cream-50">
        <section className="container-medium py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Support</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-charcoal-900 sm:text-5xl">
              {c.title}
            </h1>
            <p className="mt-3 text-lg text-charcoal-600">{c.subtitle}</p>
            <p className="mt-4 text-charcoal-600">{c.intro}</p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_20rem]">
            <ContactForm />

            <aside className="space-y-6">
              <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-card">
                <h2 className="font-serif text-xl font-semibold text-charcoal-900">
                  Email us directly
                </h2>
                <a
                  href={`mailto:${config.email.support}`}
                  className="mt-2 inline-flex items-center gap-2 text-gold-600 hover:text-gold-700"
                >
                  {config.email.support}
                </a>
                <p className="mt-4 text-sm text-charcoal-500">{c.responseNote}</p>
              </div>

              <div className="rounded-3xl border border-cream-200 bg-cream-100 p-6">
                <h2 className="font-serif text-xl font-semibold text-charcoal-900">
                  {c.faqTitle}
                </h2>
                <p className="mt-2 text-sm text-charcoal-600">{c.faqNote}</p>
                <a
                  href="/#faq"
                  className="btn btn-ghost mt-5 px-5 py-2.5 text-sm"
                >
                  {c.faqCta}
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
