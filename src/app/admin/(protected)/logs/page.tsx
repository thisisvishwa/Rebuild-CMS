import type { Metadata } from "next";
import { SystemLogsClient } from "@/components/admin/SystemLogsClient";

export const metadata: Metadata = { title: "System Logs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function LogsPage() {
  return <SystemLogsClient />;
}
