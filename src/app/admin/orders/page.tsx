import type { Metadata } from "next";
import { OrdersClient } from "@/components/admin/OrdersClient";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return <OrdersClient />;
}
