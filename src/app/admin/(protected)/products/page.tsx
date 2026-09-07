import type { Metadata } from "next";
import { ProductsClient } from "@/components/admin/ProductsClient";

export const metadata: Metadata = { title: "Products", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return <ProductsClient />;
}
