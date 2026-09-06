import type { Metadata } from "next";
import { TestimonialsClient } from "@/components/admin/TestimonialsClient";

export const metadata: Metadata = { title: "Testimonials", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function TestimonialsPage() {
  return <TestimonialsClient />;
}
