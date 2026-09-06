import type { Metadata } from "next";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const metadata: Metadata = { title: "Admin Users", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
