import type { Metadata } from "next";
import { LegalClient } from "@/components/admin/LegalClient";

export const metadata: Metadata = { title: "Legal Pages", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function LegalPage() {
  return <LegalClient />;
}
