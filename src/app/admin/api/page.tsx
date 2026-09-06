import type { Metadata } from "next";
import { ApiClient } from "@/components/admin/ApiClient";

export const metadata: Metadata = { title: "API & Webhooks", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ApiPage() {
  return <ApiClient />;
}
