import type { Metadata } from "next";
import { CustomersClient } from "@/components/admin/CustomersClient";

export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return <CustomersClient />;
}
