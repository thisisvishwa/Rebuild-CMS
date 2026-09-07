import type { Metadata } from "next";
import { EbookClient } from "@/components/admin/EbookClient";

export const metadata: Metadata = { title: "eBook Management", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function EbookPage() {
  return <EbookClient />;
}
