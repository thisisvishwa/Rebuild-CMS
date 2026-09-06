import type { Metadata } from "next";
import { RolesClient } from "@/components/admin/RolesClient";

export const metadata: Metadata = { title: "Roles & Permissions", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function RolesPage() {
  return <RolesClient />;
}
