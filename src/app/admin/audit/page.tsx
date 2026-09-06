import type { Metadata } from "next";
import { AuditClient } from "@/components/admin/AuditClient";

export const metadata: Metadata = { title: "Audit Logs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AuditPage() {
  return <AuditClient />;
}
