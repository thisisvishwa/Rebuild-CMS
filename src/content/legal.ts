/**
 * Legal and support page copy.
 *
 * These are professional, editable templates. Before going live, review them
 * with qualified counsel for your jurisdiction and update the placeholders
 * (business name, address, contact details) to your real business information.
 */
import { config } from "@/lib/config";

const productName = config.app.productName;

export const legalPages = {
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: 6 September 2026",
    intro: `This Privacy Policy explains how ${productName} ("we", "us") collects, uses, and protects information when you visit our site or purchase our digital product. We are committed to keeping your information private and to collecting only what we genuinely need to serve you.`,
    sections: [
      {
        heading: "1. What we collect",
        body: `When you place an order we collect the minimum required to process it: your name, email address, country, and payment-related details handled by our payment processors (Razorpay, PayPal, or Wise). We do not collect sensitive emotional or health information about you, and we do not ask intrusive questions.`,
      },
      {
        heading: "2. How we use your information",
        body: `We use your information to process your order, confirm your purchase, deliver your digital access and download links, provide customer support, and comply with legal and accounting obligations. Where you consent, we may use your email to send important transactional updates only.`,
      },
      {
        heading: "3. Payment security",
        body: `Card and bank details are collected and processed entirely by our payment providers (Razorpay for cards/UPI, PayPal, and Wise). We never see, collect, or store your full card number or payment credentials. Payments are verified server-side before access is granted.`,
      },
      {
        heading: "4. Cookies & analytics",
        body: `We use a small number of necessary cookies and, if you opt in and it is enabled, privacy-respecting analytics to understand how the site performs. Analytics IDs are configurable via environment variables and can be disabled entirely. We do not use analytics to profile sensitive personal traits.`,
      },
      {
        heading: "5. Sharing",
        body: `We do not sell, rent, or trade your information. We share data only with the processors required to operate the service (payment providers, email delivery, and hosting) and only as needed to fulfil your order and operate this site.`,
      },
      {
        heading: "6. Data retention",
        body: `We retain order and contact records as needed to operate the service and to meet legal, tax, and accounting requirements. Download access links are signed and expire automatically to limit casual sharing.`,
      },
      {
        heading: "7. Your rights",
        body: `Depending on your location, you may have rights to access, correct, or delete your personal data, or to object to certain processing. To exercise these rights, contact us at ${config.email.support}.`,
      },
      {
        heading: "8. Security",
        body: `We apply industry-standard measures including encrypted transport (HTTPS), server-side payment verification, signed expiry download links, input validation, rate limiting, and secure environment variables. No method of transmission or storage is 100% secure, but we work to protect your data.`,
      },
      {
        heading: "9. Contact",
        body: `For any privacy-related questions, email ${config.email.support}.`,
      },
    ],
  },

  terms: {
    title: "Terms & Conditions",
    updated: "Last updated: 6 September 2026",
    intro: `These Terms & Conditions ("Terms") govern your use of the ${productName} website and your purchase of our digital product. By using the site or completing a purchase you agree to these Terms.`,
    sections: [
      {
        heading: "1. The product",
        body: `${productName} is a self-guided, digital personal-development and educational resource covering emotional recovery after a relationship ends. It is delivered as a digital product (eBook / workbook) and supplementary material. It is not medical, psychological, psychiatric, or therapeutic treatment.`,
      },
      {
        heading: "2. Digital nature & delivery",
        body: `Because this is an instant digital product, access and download instructions are delivered electronically after a successful, verified payment. Download links may expire for security; re-request access via the access page or support if a link has lapsed.`,
      },
      {
        heading: "3. Personal use & licence",
        body: `Your purchase grants you a personal, non-transferable licence to access and use the material for your own personal development. You may not resell, redistribute, reproduce, or share the paid content publicly without permission.`,
      },
      {
        heading: "4. Payments & taxes",
        body: `Payments are processed by Razorpay, PayPal, and Wise. Prices are displayed in the relevant currency. Applicable taxes, where configured, are shown at checkout. We never store full payment credentials.`,
      },
      {
        heading: "5. Refunds",
        body: `Refunds are governed by our separate Refund Policy, which forms part of these Terms. Please review it before purchasing.`,
      },
      {
        heading: "6. No professional advice",
        body: `The material is educational in nature and is not a substitute for professional care. It does not diagnose, treat, or cure any condition. If you are in distress, please seek help from a qualified professional or emergency service in your area.`,
      },
      {
        heading: "7. No guarantees",
        body: `We make no guarantees regarding specific outcomes, healing timelines, reconciliation, or emotional states. Results vary from person to person and depend on many factors beyond our control.`,
      },
      {
        heading: "8. Intellectual property",
        body: `All content, branding, design, and material are the property of ${productName} or its licensors and are protected by copyright. Unauthorised use is prohibited.`,
      },
      {
        heading: "9. Limitation of liability",
        body: `To the fullest extent permitted by law, ${productName} is not liable for indirect, incidental, or consequential damages arising from use of the material, including any emotional or personal outcomes. Our total liability is limited to the amount you paid for the product.`,
      },
      {
        heading: "10. Changes to these terms",
        body: `We may update these Terms from time to time. Continued use after changes constitutes acceptance of the updated Terms.`,
      },
      {
        heading: "11. Contact",
        body: `Questions about these Terms can be sent to ${config.email.support}.`,
      },
    ],
  },

  refund: {
    title: "Refund Policy",
    updated: "Last updated: 6 September 2026",
    intro: `We want you to feel confident in your purchase. Below is the current refund policy for ${productName}. This policy is a default template — replace the terms below with your official, final policy before going live.`,
    sections: [
      {
        heading: "Digital product",
        body: `Because this is an instantly delivered digital product, all sales are generally considered final once access has been delivered. This is standard for digital goods.`,
      },
      {
        heading: "Qualifying refunds",
        body: `A refund may be considered if the product was purchased in error, was double-charged, or if a verifiable technical fault prevented delivery and we were unable to resolve it through reasonable support.`,
      },
      {
        heading: "How to request a refund",
        body: `Email ${config.email.support} with your order number and a brief reason for your request. We aim to respond within a reasonable time. Any refund, if approved, will be issued to the original payment method.`,
      },
      {
        heading: "Non-eligible situations",
        body: `Refunds are not provided simply because the material didn't produce a specific emotional result, or because you no longer wish to use it — we cannot guarantee personal outcomes, as outlined in our Terms.`,
      },
      {
        heading: "Contact",
        body: `For any questions about this policy, contact ${config.email.support}.`,
      },
    ],
  },

  disclaimer: {
    title: "Disclaimer",
    updated: "Last updated: 6 September 2026",
    intro: `Please read this disclaimer carefully before relying on the material.`,
    sections: [
      {
        heading: "Educational purpose",
        body: `${productName} is an educational and self-guided personal-development resource. It is provided for informational and self-growth purposes only.`,
      },
      {
        heading: "Not medical or psychological advice",
        body: `The material is not medical, psychological, psychiatric, or emergency treatment and does not in any way replace professional care, diagnosis, or treatment from a qualified healthcare or mental-health professional.`,
      },
      {
        heading: "Seek help if you need it",
        body: `If you are experiencing severe distress, feel unsafe, or are considering harming yourself or someone else, seek immediate help from an appropriate qualified professional or emergency service in your area. You are not alone, and there are people who can help.`,
      },
      {
        heading: "No guaranteed outcomes",
        body: `We make no promises of healing, recovery, reconciliation, or specific emotional outcomes. Results depend on many personal factors and vary from person to person.`,
      },
      {
        heading: "Your responsibility",
        body: `By using this material you accept that you are responsible for your own well-being and for seeking appropriate professional support where needed. If you have any health concerns, consult a qualified professional.`,
      },
    ],
  },

  contact: {
    title: "Contact & Support",
    subtitle: "We're here to help. Reach out any time.",
    intro:
      "Whether you have a question about the product, an issue with your order, or need help with digital access, we'll do our best to assist you.",
    email: config.email.support,
    responseNote:
      "We aim to respond to all messages promptly. For payment or access issues, please include your order number so we can help quickly.",
    faqTitle: "Before you write",
    faqNote:
      "Many common questions are already answered on the FAQ page — it may well save you a wait.",
    faqCta: "Read the FAQ",
  },
};
