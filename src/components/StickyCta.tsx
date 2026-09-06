"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { stickyCta } from "@/content/landing";
import { cn } from "@/lib/utils";

/**
 * Mobile-only sticky CTA bar. Slides in after the user scrolls past the hero so
 * the top of the page isn't covered, and hides when the pricing/footer region
 * is in view. Adds bottom padding on the page so it never covers content.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > 640;
      const nearEnd =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 220;
      setVisible(pastHero && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-cream-50/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur-md transition-all duration-300 md:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-charcoal-700">
          <span className="font-semibold">{stickyCta.label}</span>
          <span className="ml-2 font-serif text-lg font-semibold text-gold-700">
            {stickyCta.price}
          </span>
        </span>
        <Link
          href={stickyCta.href}
          className="btn btn-gold px-6 py-3 text-sm"
        >
          Get the eBook
        </Link>
      </div>
    </div>
  );
}
