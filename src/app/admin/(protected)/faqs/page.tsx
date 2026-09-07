import type { Metadata } from "next";
import { FaqsClient } from "@/components/admin/FaqsClient";

export const metadata: Metadata = { title: "FAQs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function FaqsPage() {
  return <FaqsClient />;
}
