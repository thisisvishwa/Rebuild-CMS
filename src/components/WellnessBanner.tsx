import Link from "next/link";
import { Info } from "lucide-react";
import { disclaimerText } from "@/content/landing";

/**
 * A quiet, non-intrusive wellness disclaimer shown on the sales page.
 * Kept visually light so it informs without commanding attention.
 */
export function WellnessBanner() {
  return (
    <section className="border-t border-cream-200 bg-cream-50 py-10">
      <div className="container-medium">
        <div className="flex flex-col items-start gap-3 sm:flex-row">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 text-gold-600">
            <Info className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="text-sm leading-relaxed text-charcoal-600">
            <p className="font-serif text-base font-semibold text-charcoal-800">
              A note on care
            </p>
            <p className="mt-1">{disclaimerText}</p>
            <p className="mt-2 text-xs text-charcoal-500">
              Read the full{" "}
              <Link href="/disclaimer" className="link-underline">
                disclaimer
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="link-underline">
                contact support
              </Link>{" "}
              if you have questions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
