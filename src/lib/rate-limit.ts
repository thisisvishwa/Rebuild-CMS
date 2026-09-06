import { config } from "@/lib/config";

/**
 * Minimal, dependency-free in-memory rate limiter.
 *
 * Suitable for a single-instance deployment. For horizontally-scaled
 * production deployments, swap this for a shared store (e.g. Redis-backed) —
 * the interface is intentionally small and easy to replace.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Periodic cleanup of expired entries to prevent unbounded memory growth.
let cleanupTimer: NodeJS.Timeout | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, config.security.rateLimitWindowMs);
  // Do not keep the process alive solely for the cleanup timer.
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const entry = store.get(key);
  const windowMs = config.security.rateLimitWindowMs;
  const max = config.security.rateLimitMax;

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  const ok = entry.count <= max;
  return {
    ok,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}
