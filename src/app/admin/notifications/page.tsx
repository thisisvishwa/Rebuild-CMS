import type { Metadata } from "next";
import { NotificationsClient } from "@/components/admin/NotificationsClient";

export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return <NotificationsClient />;
}
