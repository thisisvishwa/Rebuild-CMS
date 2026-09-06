import { config } from "@/lib/config";

/**
 * Analytics tracking.
 *
 * - Client events use a tiny, dependency-free pub/sub so we can record events
 *   (e.g. checkout_initiated, purchase_completed) without coupling to a vendor.
 * - If GA (Google Analytics 4) is enabled via env vars, we also forward the
 *   same events. Analytics is off by default (ANALYTICS_PROVIDER="none").
 *
 * We deliberately do not collect sensitive emotional or health information.
 */

export type AnalyticsEvent =
  | "landing_view"
  | "cta_click"
  | "pricing_view"
  | "checkout_opened"
  | "payment_method_selected"
  | "checkout_initiated"
  | "purchase_completed"
  | "download_accessed"
  | "error_shown";

// Client-side event bus (safe to import in components).
type Listener = (event: AnalyticsEvent, data?: Record<string, unknown>) => void;
const listeners: Listener[] = [];

export function trackEvent(
  event: AnalyticsEvent,
  data?: Record<string, unknown>,
): void {
  // Local bus (e.g. for tests / middleware / devtools).
  for (const fn of listeners) {
    try {
      fn(event, data);
    } catch {
      /* ignore */
    }
  }

  // Google Analytics 4 (only when enabled).
  if (
    config.analytics.provider === "ga" &&
    config.analytics.gaId &&
    typeof window !== "undefined"
  ) {
    const gtag = (window as unknown as Record<string, unknown>).gtag;
    if (typeof gtag === "function") {
      (gtag as (...args: unknown[]) => void)("event", event, data ?? {});
    }
  }
}

export function subscribeAnalytics(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
