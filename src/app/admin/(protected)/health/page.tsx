import type { Metadata } from "next";
import { HealthClient } from "@/components/admin/HealthClient";

export const metadata: Metadata = { title: "System Health", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function HealthPage() {
  return <HealthClient />;
}
