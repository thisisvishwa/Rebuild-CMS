import type { Metadata } from "next";
import { EmailClient } from "@/components/admin/EmailClient";

export const metadata: Metadata = { title: "Email", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function EmailPage() {
  return <EmailClient />;
}
