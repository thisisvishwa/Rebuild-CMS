import type { Metadata } from "next";
import { CouponsClient } from "@/components/admin/CouponsClient";

export const metadata: Metadata = { title: "Coupons", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function CouponsPage() {
  return <CouponsClient />;
}
