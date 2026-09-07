import type { Metadata } from "next";
import { CustomerDetailClient } from "@/components/admin/CustomerDetailClient";

export const metadata: Metadata = { title: "Customer Detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return <CustomerDetailClient id={params.id} />;
}
