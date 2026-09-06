import type { Metadata } from "next";
import Link from "next/link";
import { Download, Lock, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { verifyAccessToken } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Your Access",
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-cream-200 bg-white p-8 shadow-card sm:p-10">
      {children}
    </div>
  );
}

export default async function AccessPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  // No token.
  if (!token) {
    return (
      <Shell>
        <Card>
          <Lock className="h-10 w-10 text-gold-600" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-3xl font-semibold text-charcoal-900">
            Missing access link
          </h1>
          <p className="mt-3 text-charcoal-600">
            We couldn't find an access link in this address. Please use the link
            from your confirmation email, or contact support and we'll help.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/contact" className="btn btn-primary">
              <Mail className="h-4 w-4" /> Contact support
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  let claims = null;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    claims = null;
  }

  // Invalid or expired token.
  if (!claims) {
    return (
      <Shell>
        <Card>
          <Lock className="h-10 w-10 text-gold-600" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-3xl font-semibold text-charcoal-900">
            This link has expired
          </h1>
          <p className="mt-3 text-charcoal-600">
            For your security, access links expire after a short time. Request a
            fresh one from your confirmation email, or contact support and we'll
            send you a new link.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/contact" className="btn btn-primary">
              <Mail className="h-4 w-4" /> Get a new link
            </Link>
            <Link href="/" className="btn btn-ghost">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber: claims.orderNumber, email: claims.email },
  });

  // Order doesn't exist or isn't paid.
  if (!order || order.status !== "paid" || !order.accessGranted) {
    return (
      <Shell>
        <Card>
          <Lock className="h-10 w-10 text-gold-600" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-3xl font-semibold text-charcoal-900">
            Access not available
          </h1>
          <p className="mt-3 text-charcoal-600">
            We couldn't find a paid order for this link. If you believe this is a
            mistake, contact support with your order number and we'll sort it out.
          </p>
          <div className="mt-6">
            <Link href="/contact" className="btn btn-primary">
              <Mail className="h-4 w-4" /> Contact support
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  // Valid and paid.
  const downloadUrl = `/api/access/download?token=${encodeURIComponent(token)}`;

  return (
    <Shell>
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-200 text-sage-600">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Access granted</p>
            <h1 className="font-serif text-3xl font-semibold text-charcoal-900">
              {config.app.productName}
            </h1>
          </div>
        </div>

        <p className="mt-5 text-charcoal-600">
          Your copy is ready. This is a private link tied to your order — download
          it now to start your recovery journey.
        </p>

        <div className="mt-6 rounded-2xl border border-cream-200 bg-cream-50 p-4 text-sm text-charcoal-600">
          <p><span className="font-semibold text-charcoal-800">Order:</span> {order.orderNumber}</p>
          <p className="mt-1"><span className="font-semibold text-charcoal-800">Email:</span> {order.email}</p>
        </div>

        <a href={downloadUrl} className="btn btn-gold mt-6 w-full" download>
          <Download className="h-5 w-5" /> Download your eBook
        </a>

        <p className="mt-4 text-xs text-charcoal-500">
          This link is private and expires for your security. If it stops working,
          contact {config.email.support} for a fresh one.
        </p>
      </Card>
    </Shell>
  );
}
