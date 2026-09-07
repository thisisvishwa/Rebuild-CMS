import type { Metadata } from "next";
import { SeoClient } from "@/components/admin/SeoClient";

export const metadata: Metadata = { title: "SEO", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function SeoPage() {
  return <SeoClient />;
}
