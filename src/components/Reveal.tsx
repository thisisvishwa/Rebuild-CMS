"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the reveal starts once visible. */
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}

/**
 * A subtle fade-up reveal on scroll.
 *
 * - Uses IntersectionObserver so content appears once it enters the viewport.
 * - Starts translated & transparent, then eases in.
 * - Fully disables itself when the user prefers reduced motion (element is
 *   simply shown, no transform/animation).
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    // If the element is already in (or above) the viewport on mount, show it
    // immediately without waiting for a scroll event.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);

    // Safety net: never allow content to stay permanently hidden if the
    // observer fails to fire (e.g. unusual embedding environments).
    const fallback = setTimeout(() => setShown(true), 3500);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, [reduced]);

  const Tag = as as "div";

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
