import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Payment Not Completed",
  robots: { index: false, follow: false },
};

export default function PaymentFailedPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center bg-cream-50 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-cream-200 bg-white p-8 text-center shadow-card sm:p-10">
          <AlertTriangle className="mx-auto h-12 w-12 text-gold-600" aria-hidden="true" />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-charcoal-900">
            Payment wasn&apos;t completed
          </h1>
          <p className="mt-3 text-charcoal-600">
            You haven&apos;t been charged. This can happen if you closed the payment
            window, cancelled, or a card was declined. You can safely try again.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/checkout" className="btn btn-primary">
              Try the checkout again
            </Link>
            <Link href="/" className="btn btn-ghost">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
          <p className="mt-6 border-t border-cream-200 pt-5 text-sm text-charcoal-500">
            Stuck or unsure what happened?{" "}
            <a href={`mailto:${config.email.support}`} className="link-underline">
              <Mail className="mr-1 inline h-3.5 w-3.5" />
              Contact support
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
