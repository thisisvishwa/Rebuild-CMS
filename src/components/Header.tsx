"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/Button";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-cream-50/85 backdrop-blur-md shadow-[0_1px_0_0_rgba(33,31,27,0.06)]"
          : "bg-transparent",
      )}
    >
      <div className="container-wide flex h-16 items-center justify-between sm:h-20">
        <Link href="/#top" aria-label={`${site.name} home`} className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-charcoal-600 transition-colors hover:text-charcoal-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <ButtonLink href="/checkout" variant="primary" size="md">
            Get the eBook
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-charcoal-800 hover:bg-cream-200 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile navigation panel */}
      <div
        id="mobile-menu"
        className={cn(
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-300",
          open ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container-wide border-t border-cream-200 bg-cream-50/95 pb-6 pt-3 backdrop-blur-md" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-charcoal-700 hover:bg-cream-200"
                >
                  {item.label}
                  <ArrowUpRight className="h-4 w-4 text-charcoal-400" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4" onClick={() => setOpen(false)}>
            <ButtonLink href="/checkout" variant="primary" size="lg" className="w-full">
              Get the eBook
            </ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
