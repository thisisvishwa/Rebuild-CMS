import type { Metadata } from "next";
import { DownloadsClient } from "@/components/admin/DownloadsClient";

export const metadata: Metadata = { title: "Downloads", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function DownloadsPage() {
  return <DownloadsClient />;
}
