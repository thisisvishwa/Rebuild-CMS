import type { Metadata } from "next";
import { PaymentsClient } from "@/components/admin/PaymentsClient";

export const metadata: Metadata = { title: "Payments", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function PaymentsPage() {
  return <PaymentsClient />;
}
