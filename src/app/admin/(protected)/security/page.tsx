import type { Metadata } from "next";
import { SecurityClient } from "@/components/admin/SecurityClient";

export const metadata: Metadata = { title: "Security", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function SecurityPage() {
  return <SecurityClient />;
}
