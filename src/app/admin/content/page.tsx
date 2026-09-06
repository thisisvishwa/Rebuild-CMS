import type { Metadata } from "next";
import { ContentClient } from "@/components/admin/ContentClient";

export const metadata: Metadata = { title: "Website CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ContentPage() {
  return <ContentClient />;
}
