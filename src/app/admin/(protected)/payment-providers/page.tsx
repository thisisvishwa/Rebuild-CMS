import type { Metadata } from "next";
import { PaymentProvidersClient } from "@/components/admin/PaymentProvidersClient";

export const metadata: Metadata = { title: "Payment Providers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function PaymentProvidersPage() {
  return <PaymentProvidersClient />;
}
