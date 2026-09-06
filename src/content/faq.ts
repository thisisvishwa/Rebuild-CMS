/**
 * FAQ accordion content. Each item has a question and an answer string
 * (answers may contain simple `**bold**` markers parsed by the component).
 */
import { config } from "@/lib/config";

const price = config.price.display;

export interface FaqItem {
  q: string;
  a: string;
}

export const faq: FaqItem[] = [
  {
    q: "Is this a physical book?",
    a: "No — it is a digital product. You'll receive secure digital access, and it's designed to be readable on the device you already own.",
  },
  {
    q: "How will I receive it?",
    a: "After a successful payment, you'll be taken to a private access page with download instructions. A confirmation email and a getting-started email are also sent to the address provided at checkout.",
  },
  {
    q: "Can I read it on my phone?",
    a: "Yes. The eBook is delivered in a mobile-friendly format, so you can read it on your phone, tablet, or computer — whatever suits you best.",
  },
  {
    q: "Is this only for people who were dumped?",
    a: "No. It can be useful for anyone experiencing a breakup, separation, divorce, or other significant relationship loss — whether the decision to end it was yours, theirs, or mutual.",
  },
  {
    q: "How quickly will I recover?",
    a: "There is no single recovery timeline, and we won't try to promise one. Everyone's experience is different. The material is designed to be worked through at your own pace, and it's yours to return to whenever you need it.",
  },
  {
    q: "Can this replace therapy?",
    a: "No. This is a self-guided educational and personal-development resource — a workbook-style companion to your own effort. It is not a replacement for professional mental-health care. If you're in need of support from a qualified professional, please reach out to one; there's also a wellness disclaimer at checkout.",
  },
  {
    q: "What payment methods are available?",
    a: "Razorpay (credit/debit cards and, where supported, UPI), PayPal, and Wise — subject to the payment setup enabled at checkout. All cards are processed securely by Razorpay; no card details are ever stored on this site.",
  },
  {
    q: "Do you offer refunds?",
    a: "Please see the full Refund Policy page for the exact terms, including any qualifying period and how to request one.",
  },
  {
    q: "Is my information private?",
    a: "Yes. We collect only what's needed to process your order and deliver your access. We never collect sensitive health or emotional details, and we never share your data for marketing. See the Privacy Policy for full details.",
  },
];

export const faqSection = {
  eyebrow: "Questions",
  headline: "Good questions, answered honestly.",
  intro:
    "A few things people often ask before they start. If you can't find what you need, just contact support.",
  contactCta: "Still have questions? Contact support",
};
