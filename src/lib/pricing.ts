import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/admin/settings";
import { config } from "@/lib/config";

/**
 * Central pricing (shared by storefront display, checkout, orders, invoices).
 *
 * The backend is the single source of truth: price/currency/tax come from the
 * admin-managed settings (with env fallbacks), so the storefront never sets the
 * price. Tax splits are computed here and reused everywhere.
 */
export function computePricing(
  priceMinor: number,
  taxEnabled: boolean,
  taxRatePercent: number,
  taxInclusive: boolean,
) {
  let base = priceMinor;
  let tax = 0;
  let total = priceMinor;
  if (taxEnabled && taxRatePercent > 0) {
    const rate = taxRatePercent;
    if (taxInclusive) {
      tax = Math.round(base - base / (1 + rate / 100));
      total = base;
    } else {
      tax = Math.round(base * (rate / 100));
      total = base + tax;
    }
  }
  return { baseMinor: base, taxMinor: tax, totalMinor: total, taxRatePercent, taxEnabled };
}

export interface ResolvedPricing {
  productId: string | null;
  productName: string;
  currency: string;
  priceMinor: number;
  baseMinor: number;
  taxMinor: number;
  totalMinor: number;
  taxEnabled: boolean;
  taxRatePercent: number;
}

/** Resolve the active product + authoritative pricing from settings/product DB. */
export async function resolveActivePricing(slug?: string): Promise<ResolvedPricing> {
  const settings = await getSettings();
  const product = await prisma.product.findFirst({
    where: slug ? { slug, isActive: true } : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const taxEnabled = settings["commerce.taxEnabled"] === "true";
  const taxRatePercent = Number(settings["commerce.taxRatePercent"] ?? 0);
  const taxInclusive = settings["commerce.taxInclusive"] !== "false";
  const priceMinor = product?.priceMinor ?? Number(settings["commerce.priceMinor"] ?? config.price.amountMinor);
  const currency = settings["commerce.currency"] || config.price.currency;
  const p = computePricing(priceMinor, taxEnabled, taxRatePercent, taxInclusive);

  return {
    productId: product?.id ?? null,
    productName: product?.name ?? config.app.productName,
    currency,
    priceMinor,
    baseMinor: p.baseMinor,
    taxMinor: p.taxMinor,
    totalMinor: p.totalMinor,
    taxEnabled,
    taxRatePercent,
  };
}
