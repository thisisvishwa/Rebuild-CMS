import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names intelligently. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a minor (smallest) currency unit into a display string.
 * e.g. 4900 -> "$49.00" when currency is USD.
 */
export function formatMoney(amountMinor: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
}

/** Generate a short, human-friendly order reference (not an ID). */
export function generateOrderNumber(): string {
  const stamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RB-${stamp}-${rand}`;
}

/** Return a random nonce for one-time signed links (cross-platform global crypto). */
export function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Delay helper (used in demo mode to simulate real payment latency). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
