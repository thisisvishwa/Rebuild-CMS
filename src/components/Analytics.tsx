"use client";

import { useEffect } from "react";
import { config } from "@/lib/config";
import { trackEvent } from "@/lib/analytics";

/**
 * Client analytics bootstrap.
 *
 * Loads Google Analytics 4 only when explicitly enabled via environment
 * variables (ANALYTICS_PROVIDER="ga" and a NEXT_PUBLIC_GA_MEASUREMENT_ID).
 * By default (provider "none") nothing is loaded and no data leaves the site.
 *
 * The component also emits a single `landing_view` event on mount so analytics
 * (or a custom subscriber) can observe a page view.
 */
export function Analytics() {
  useEffect(() => {
    if (
      config.analytics.provider === "ga" &&
      config.analytics.gaId &&
      typeof window !== "undefined"
    ) {
      const id = config.analytics.gaId;
      const w = window as unknown as Record<string, unknown>;
      const dataLayer = (w.dataLayer ?? []) as unknown[];
      w.dataLayer = dataLayer;
      const gtag = (...args: unknown[]) => dataLayer.push(args);
      w.gtag = gtag;
      gtag("js", new Date());
      gtag("config", id);

      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(s);
    }

    trackEvent("landing_view", { path: window.location.pathname });
  }, []);

  return null;
}
