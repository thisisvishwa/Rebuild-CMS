import type { Metadata } from "next";
import { BackupsClient } from "@/components/admin/BackupsClient";

export const metadata: Metadata = { title: "Backups", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function BackupsPage() {
  return <BackupsClient />;
}
