import type { Metadata } from "next";
import { InvoicesClient } from "@/components/admin/InvoicesClient";

export const metadata: Metadata = { title: "Invoices", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function InvoicesPage() {
  return <InvoicesClient />;
}
