import Link from "next/link";
import { Mail, ShieldCheck, FileLock2, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { config } from "@/lib/config";

const items = [
  {
    icon: ShieldCheck,
    title: "Secure payment",
    text: "Checkout is processed by Razorpay, PayPal, and Wise. Payment signatures are verified server-side; your card details never touch this site.",
  },
  {
    icon: FileLock2,
    title: "Private digital delivery",
    text: `Access is granted only after a verified payment, delivered through a personalised, expiring link so it isn't casually shared.`,
  },
  {
    icon: Mail,
    title: "Human support",
    text: `Questions or an issue with your order? Reach us at ${config.email.support} — we're here to help.`,
  },
  {
    icon: HelpCircle,
    title: "Clear policies",
    text: "We keep our terms, refund, and privacy policies transparent so you know exactly what to expect.",
  },
];

export function Trust() {
  return (
    <section id="trust" className="bg-cream-50 py-20 sm:py-24">
      <div className="container-wide">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Peace of mind</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            A purchase you can trust.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-600">
            We're transparent about how payment, delivery, and support work — so
            you can focus on your recovery, not on second-guessing the checkout.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
                <item.icon className="h-7 w-7 text-gold-600" aria-hidden="true" />
                <h3 className="mt-4 font-serif text-xl font-semibold text-charcoal-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-600">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-charcoal-600">
          <Link href="/refund-policy" className="link-underline">
            Refund Policy
          </Link>
          <Link href="/terms" className="link-underline">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy-policy" className="link-underline">
            Privacy Policy
          </Link>
          <Link href="/contact" className="link-underline">
            Contact &amp; Support
          </Link>
        </div>
      </div>
    </section>
  );
}
