import type { Metadata } from "next";
import { VisitorsClient } from "@/components/admin/VisitorsClient";

export const metadata: Metadata = { title: "Visitors", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function VisitorsPage() {
  return <VisitorsClient />;
}
