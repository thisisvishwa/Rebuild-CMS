import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, ArrowLeft, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { signAccessToken, buildAccessUrl } from "@/lib/access";

export const metadata: Metadata = {
  title: "Payment Successful",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center bg-cream-50 py-16">
        {children}
      </main>
      <Footer />
    </>
  );
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string; method?: string };
}) {
  const orderId = searchParams.order;
  const method = searchParams.method ?? "";

  if (!orderId) {
    return (
      <Shell>
        <div className="w-full max-w-lg rounded-3xl border border-cream-200 bg-white p-8 text-center shadow-card sm:p-10">
          <CheckCircle2 className="mx-auto h-12 w-12 text-sage-500" aria-hidden="true" />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-charcoal-900">
            Your recovery journey starts here.
          </h1>
          <p className="mt-3 text-charcoal-600">
            Thank you. If you've completed a purchase, your access link has been
            sent to your email. If you need it again, contact support.
          </p>
          <div className="mt-6">
            <Link href="/access" className="btn btn-primary">
              Open access page
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  const paid = order?.status === "paid" && order.accessGranted;

  if (!order || !paid) {
    return (
      <Shell>
        <div className="w-full max-w-lg rounded-3xl border border-cream-200 bg-white p-8 text-center shadow-card sm:p-10">
          <Mail className="mx-auto h-12 w-12 text-gold-600" aria-hidden="true" />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-charcoal-900">
            We're confirming your payment
          </h1>
          <p className="mt-3 text-charcoal-600">
            Your order is being processed. If you've paid, access will appear in
            your inbox shortly. If you don't see it, please check your spam folder
            or contact us and we'll help right away.
          </p>
          <div className="mt-6">
            <Link href="/contact" className="btn btn-primary">
              <Mail className="h-4 w-4" /> Contact support
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // Generate a fresh access link for the success screen.
  const accessUrl = await buildAccessUrl(
    await signAccessToken({ orderNumber: order.orderNumber, email: order.email }),
  );

  return (
    <Shell>
      <div className="w-full max-w-lg rounded-3xl border border-cream-200 bg-white p-8 shadow-card sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-200 text-sage-600">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Payment {method ? `via ${method}` : "complete"}</p>
            <h1 className="font-serif text-3xl font-semibold text-charcoal-900">
              Your recovery journey starts here.
            </h1>
          </div>
        </div>

        <p className="mt-5 text-charcoal-600">
          Thank you for your purchase. Your copy of <strong>{config.app.productName}</strong> is
          ready — open your private access page to download it and begin.
        </p>

        <div className="mt-6 rounded-2xl border border-cream-200 bg-cream-50 p-4 text-sm text-charcoal-600">
          <p><span className="font-semibold text-charcoal-800">Order:</span> {order.orderNumber}</p>
          <p className="mt-1"><span className="font-semibold text-charcoal-800">Email:</span> {order.email}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link href={accessUrl} className="btn btn-gold w-full">
            <Download className="h-5 w-5" /> Access your eBook
          </Link>
          <Link href="/" className="btn btn-ghost w-full">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        <p className="mt-4 text-xs text-charcoal-500">
          A confirmation email has been sent. Access links expire for security; if
          you need a fresh one, contact {config.email.support}.
        </p>
      </div>
    </Shell>
  );
}
