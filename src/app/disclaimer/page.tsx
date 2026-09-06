import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legalPages } from "@/content/legal";
import { disclaimerText } from "@/content/landing";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Educational and self-guided wellness disclaimer for our digital product.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title={legalPages.disclaimer.title}
      updated={legalPages.disclaimer.updated}
      intro={legalPages.disclaimer.intro}
      sections={legalPages.disclaimer.sections}
    />
  );
}
