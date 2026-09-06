import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legalPages } from "@/content/legal";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title={legalPages.privacy.title}
      updated={legalPages.privacy.updated}
      intro={legalPages.privacy.intro}
      sections={legalPages.privacy.sections}
    />
  );
}
