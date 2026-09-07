import type { Metadata } from "next";
import { getAuthContext } from "@/lib/admin/auth";
import { DashboardClient } from "@/components/admin/DashboardClient";

export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  return <DashboardClient />;
}
