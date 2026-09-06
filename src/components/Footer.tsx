import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { footerLinks } from "@/content/site";
import { config } from "@/lib/config";
import { disclaimerText } from "@/content/landing";

function LinkCol({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-sm text-charcoal-600 transition-colors hover:text-charcoal-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Payment-association badges — text-based so no logos are misused. */
function PaymentBadges() {
  const items = [
    { name: "Razorpay", detail: "Cards · UPI" },
    { name: "PayPal", detail: "Safe & secure" },
    { name: "Wise", detail: "International" },
  ];
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((p) => (
        <span
          key={p.name}
          className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3.5 py-1.5 text-xs font-medium text-charcoal-600"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sage-400" aria-hidden="true" />
          {p.name}
          <span className="text-charcoal-400">· {p.detail}</span>
        </span>
      ))}
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-cream-200 bg-cream-100">
      <div className="container-wide py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal-600">
              A calm, structured recovery system for anyone rebuilding after a
              breakup, separation, or divorce.
            </p>
            <a
              href={`mailto:${config.email.support}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-charcoal-700 hover:text-charcoal-900"
            >
              <Mail className="h-4 w-4 text-gold-600" />
              {config.email.support}
            </a>
          </div>

          <LinkCol title="Product" links={footerLinks.product} />
          <LinkCol title="Support" links={footerLinks.support} />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
              Payments
            </h3>
            <div className="mt-4">
              <PaymentBadges />
            </div>
            <p className="mt-5 text-xs leading-relaxed text-charcoal-500">
              Payments are processed securely by Razorpay, PayPal, and Wise. Card
              details are never stored on this site.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-cream-200 bg-cream-50 p-5 text-xs leading-relaxed text-charcoal-500">
          <p className="font-semibold text-charcoal-600">Wellness disclaimer</p>
          <p className="mt-1">{disclaimerText}</p>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-cream-200 pt-6 text-xs text-charcoal-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {config.app.productName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-charcoal-800">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-charcoal-800">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-charcoal-800">
              Refunds
            </Link>
            <Link href="/disclaimer" className="hover:text-charcoal-800">
              Disclaimer
            </Link>
            <Link href="/contact" className="hover:text-charcoal-800">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
