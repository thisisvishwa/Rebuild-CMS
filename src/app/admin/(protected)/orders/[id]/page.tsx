import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/admin/OrderDetailClient";

export const metadata: Metadata = { title: "Order Detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailClient id={params.id} />;
}
