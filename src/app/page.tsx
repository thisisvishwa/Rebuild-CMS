import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/StickyCta";
import { WellnessBanner } from "@/components/WellnessBanner";
import { StorefrontProvider } from "@/components/storefront/StorefrontProvider";
import { Hero } from "@/components/sections/Hero";
import { EmotionalProblem } from "@/components/sections/EmotionalProblem";
import { Transformation } from "@/components/sections/Transformation";
import { WhatYouGet } from "@/components/sections/WhatYouGet";
import { Phases } from "@/components/sections/Phases";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WhoFor } from "@/components/sections/WhoFor";
import { Preview } from "@/components/sections/Preview";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { Trust } from "@/components/sections/Trust";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { site } from "@/content/site";
import { config } from "@/lib/config";
import { faq } from "@/content/faq";

export default function HomePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${config.app.productName} — Breakup & Divorce Recovery Guide`,
      description: site.description,
      image: site.ogImage,
      url: config.app.url,
      brand: { "@type": "Brand", name: config.app.productName },
      offers: {
        "@type": "Offer",
        price: (config.price.amountMinor / 100).toFixed(2),
        priceCurrency: config.price.currency,
        availability: "https://schema.org/InStock",
        url: `${config.app.url}/checkout`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\*\*/g, "") },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: config.app.productName,
      url: config.app.url,
      email: config.email.support,
    },
  ];

  return (
    <>
      <Header />
      <main>
        <StorefrontProvider>
          <Hero />
          <EmotionalProblem />
          <Transformation />
          <WhatYouGet />
          <Phases />
          <HowItWorks />
          <WhoFor />
          <Preview />
          <Pricing />
          <Testimonials />
          <Trust />
          <Faq />
          <FinalCta />
        </StorefrontProvider>
      </main>
      <WellnessBanner />
      <Footer />
      <StickyCta />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
