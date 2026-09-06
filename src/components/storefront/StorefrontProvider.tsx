"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Storefront dynamic content provider.
 *
 * Loads CMS-driven values from `/api/storefront` on mount and exposes them to
 * the landing page. When the backend has no override (or the request fails), a
 * graceful fallback keeps the site fully functional with its bundled content.
 * The existing UI/design is untouched — this only supplies pricing, FAQs,
 * testimonials and section copy from the CMS when present.
 */

export interface StorefrontData {
  product: {
    name: string;
    description?: string;
    shortDescription?: string;
    currency: string;
    price: { baseMinor: number; taxMinor: number; totalMinor: number; taxEnabled: boolean; taxRatePercent: number };
    features: { title: string; text: string }[];
    activeVersion: { version: string; fileSize?: number; releaseNotes?: string } | null;
    hasActiveVersion: boolean;
  } | null;
  sections: Record<string, Record<string, unknown>>;
  faqs: { question: string; answer: string; category?: string | null }[];
  testimonials: { name: string; age?: number; situation?: string; location?: string; quote: string; imageUrl?: string }[];
  settings: { businessName: string; supportEmail: string; taxEnabled: boolean; taxRatePercent: number };
  paymentMethods: { available: string[]; environment: string };
}

const FALLBACK: StorefrontData = {
  product: null,
  sections: {},
  faqs: [],
  testimonials: [],
  settings: { businessName: "", supportEmail: "", taxEnabled: false, taxRatePercent: 0 },
  paymentMethods: { available: [], environment: "sandbox" },
};

const Ctx = createContext<StorefrontData>(FALLBACK);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StorefrontData>(FALLBACK);

  useEffect(() => {
    fetch("/api/storefront", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.ok) setData(res as StorefrontData);
      })
      .catch(() => {
        /* fallback to bundled content */
      });
  }, []);

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useStorefront() {
  return useContext(Ctx);
}
