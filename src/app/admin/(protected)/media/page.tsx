import type { Metadata } from "next";
import { MediaClient } from "@/components/admin/MediaClient";

export const metadata: Metadata = { title: "Media Library", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function MediaPage() {
  return <MediaClient />;
}
