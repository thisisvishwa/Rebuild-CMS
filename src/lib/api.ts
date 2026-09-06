import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Shared helpers for API route handlers: uniform JSON responses, safe error
 * handling (never leak stack traces), and rate limiting for mutation endpoints.
 */

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function bad(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, error: message, ...extra },
    { status },
  );
}

/** Parse and validate the request body against a Zod schema. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const text = await req.text();
  if (!text) throw new ZodError([]);
  const raw = text ? JSON.parse(text) : {};
  return schema.parse(raw);
}

/** Try to parse JSON safely; return null if it isn't valid JSON. */
export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Get the client IP string from a request (best-effort). */
export function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Apply and return a rate-limit result or a 429 response. */
export function enforceRateLimit(req: Request, key: string) {
  const result = rateLimit(key);
  if (!result.ok) {
    return {
      limited: true as const,
      response: bad(
        "You've made too many requests. Please wait a moment and try again.",
        429,
        { retryAfter: Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)) },
      ),
    };
  }
  return { limited: false as const, response: null };
}

/** Wrap a handler so unhandled errors become clean 500s. */
export function errorResponse(err: unknown, context = "request") {
  if (err instanceof ZodError) {
    return bad("Please check your details and try again.", 400, {
      issues: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }
  // Log server-side for debugging but never expose stack traces.
  console.error(`API ${context} error:`, err);
  return bad(
    "Something went wrong on our end. Please try again, or contact support if the problem persists.",
    500,
  );
}
