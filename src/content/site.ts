/**
 * Site-level metadata, navigation and footer content.
 * Edit these values to rebrand — no code changes required.
 */
import { config } from "@/lib/config";

export const site = {
  name: config.app.productName,
  domain: config.app.url.replace(/^https?:\/\//, ""),
  tagline: "Rebuild yourself after relationship loss.",
  title:
    "Breakup & Divorce Recovery Guide | Rebuild Yourself & Start Again",
  description:
    "A practical, self-guided recovery system designed to help you heal after a breakup, separation, or divorce — rebuild your identity, regain your confidence, and create a new chapter.",
  keywords:
    "breakup recovery, divorce healing, emotional healing, rebuild identity, move on, self development, relationship loss, recovery ebook, new beginning",
  ogImage: `${config.app.url}/og-image.png`,
  author: config.app.productName,

  nav: [
    { label: "What's inside", href: "/#inside" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Who it's for", href: "/#who-for" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],

  support: {
    email: config.email.support,
  },
} as const;

export const footerLinks = {
  product: [
    { label: "Overview", href: "/#top" },
    { label: "What's inside", href: "/#inside" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
  support: [
    { label: "Contact & Support", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
} as const;
