import type { Metadata } from "next";
import { TrafficClient } from "@/components/admin/TrafficClient";

export const metadata: Metadata = { title: "Traffic Sources", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function TrafficPage() {
  return <TrafficClient />;
}
