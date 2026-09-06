import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legalPages } from "@/content/legal";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Our refund policy for digital purchases.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title={legalPages.refund.title}
      updated={legalPages.refund.updated}
      intro={legalPages.refund.intro}
      sections={legalPages.refund.sections}
    />
  );
}
