import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legalPages } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms governing use of this site and purchase of our digital product.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title={legalPages.terms.title}
      updated={legalPages.terms.updated}
      intro={legalPages.terms.intro}
      sections={legalPages.terms.sections}
    />
  );
}
