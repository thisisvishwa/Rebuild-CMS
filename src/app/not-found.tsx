import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center bg-cream-50 px-5 py-16">
        <div className="text-center">
          <p className="eyebrow">404</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-charcoal-900">
            This page could not be found
          </h1>
          <p className="mx-auto mt-4 max-w-md text-charcoal-600">
            The page you're looking for may have moved or no longer exists. Let's
            get you back on track.
          </p>
          <Link href="/" className="btn btn-primary mt-8">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
