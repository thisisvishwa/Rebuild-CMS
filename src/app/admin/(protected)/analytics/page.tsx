import type { Metadata } from "next";
import { AnalyticsClient } from "@/components/admin/AnalyticsClient";

export const metadata: Metadata = { title: "Analytics", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
