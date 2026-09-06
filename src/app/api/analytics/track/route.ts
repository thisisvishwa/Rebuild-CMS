import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getSetting, getSettings } from "@/lib/admin/settings";
import { trackEvent } from "@/lib/analytics";
import { z } from "zod";
import crypto from "node:crypto";

/**
 * POST /api/analytics/track
 *
 * Privacy-considerate visitor/session tracking. Records the minimum needed to
 * power the admin Analytics, Live Visitors, Traffic Sources and Funnel modules.
 * IP addresses are anonymized by default; retention is configurable; and the
 * feature can be disabled entirely via settings.
 */
const eventSchema = z.object({
  visitorId: z.string().min(8).max(64),
  sessionId: z.string().min(8).max(64),
  event: z.enum(["pageview", "cta_click", "view_pricing", "checkout_start", "payment_init", "purchase", "download"]),
  path: z.string().max(500).default("/"),
  title: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function anonIp(ip: string): string {
  // Anonymize the last octet of IPv4 (keep /24), hash IPv6 prefix.
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      parts[3] = "0";
      return parts.join(".");
    }
  }
  return "anonymous";
}

function parseGeo(ip: string, c: NodeJS.Dict<string>) {
  // Approximate geo from platform-provided headers (Cloudflare/Vercel) — never
  // precise location. Falls back to empty/unknown.
  return {
    country: c["x-vercel-ip-country"] || c["cf-ipcountry"] || "",
    region: c["x-vercel-ip-country-region"] || "",
    city: c["x-vercel-ip-city"] || "",
  };
}

export async function POST(req: Request) {
  // Light rate-limit per IP to prevent analytics flooding.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const rl = rateLimit(`analytics:${ip}`);
  if (!rl.ok) return NextResponse.json({ ok: true }, { status: 200 }); // silently drop

  const settings = await getSettings();
  if (settings["analytics.trackVisitors"] !== "true") {
    return NextResponse.json({ ok: true, tracked: false });
  }
  const anonymize = settings["analytics.anonymizeIp"] !== "false";

  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { visitorId, sessionId, event, path, title, metadata } = parsed.data;

  const geo = parseGeo(ip, Object.fromEntries(req.headers.entries()) as NodeJS.Dict<string>);
  const ua = req.headers.get("user-agent") ?? "";
  const device = /mobile|android|iphone/i.test(ua) ? "mobile" : /tablet|ipad/i.test(ua) ? "tablet" : "desktop";
  const browser = /firefox/i.test(ua) ? "Firefox" : /edg/i.test(ua) ? "Edge" : /safari/i.test(ua) ? "Safari" : /chrome/i.test(ua) ? "Chrome" : "Other";
  const os = /windows/i.test(ua) ? "Windows" : /mac/i.test(ua) ? "macOS" : /android/i.test(ua) ? "Android" : /linux/i.test(ua) ? "Linux" : "Other";

  try {
    const storedIp = anonymize ? anonIp(ip) : ip;
    const visitor = await prisma.visitor.upsert({
      where: { visitorId },
      update: { lastSeen: new Date(), visitCount: { increment: 1 } },
      create: {
        visitorId,
        ip: storedIp,
        ipAnonymized: anonymize ? storedIp : null,
        country: geo.country || null,
        region: geo.region || null,
        device,
        browser,
        os,
        language: req.headers.get("accept-language")?.split(",")[0] || null,
        referrer: (metadata?.referrer as string) || null,
        landingPage: path,
        utmSource: (metadata?.utm_source as string) || null,
        utmMedium: (metadata?.utm_medium as string) || null,
        utmCampaign: (metadata?.utm_campaign as string) || null,
        firstVisit: new Date(),
      },
    });

    // VisitorSession.visitorId references Visitor.id (the PK), so we use the
    // internal id for session/pageview/event rows, not the client uuid.
    const visitorPkId = visitor.id;
    let session = await prisma.visitorSession.findUnique({ where: { sessionId } });
    if (!session) {
      session = await prisma.visitorSession.create({
        data: {
          sessionId,
          visitorId: visitorPkId,
          device,
          country: geo.country || null,
          referrer: (metadata?.referrer as string) || null,
          utmSource: (metadata?.utm_source as string) || null,
          utmMedium: (metadata?.utm_medium as string) || null,
          utmCampaign: (metadata?.utm_campaign as string) || null,
          currentPage: path,
          pageViews: 1,
        },
      });
    }

    // Funnel flags.
    const flag: Record<string, boolean> = {};
    if (event === "checkout_start") flag.checkoutStarted = true;
    if (event === "payment_init") flag.paymentInitiated = true;
    if (event === "purchase") flag.purchaseCompleted = true;
    if (event === "download") flag.downloaded = true;

    if (Object.keys(flag).length || event === "pageview") {
      await prisma.visitorSession.update({
        where: { id: session.id },
        data: {
          ...(flag as object),
          currentPage: path,
          pageViews: event === "pageview" ? { increment: 1 } : undefined,
          ...(event === "pageview" ? {} : {}),
          exitPage: path,
        },
      });
    }

    if (event === "pageview") {
      await prisma.pageView.create({
        data: { sessionId: session.id, visitorId: visitorPkId, path, title: title || null },
      });
    }

    await prisma.analyticsEvent.create({
      data: {
        sessionId: session.id,
        visitorId: visitorPkId,
        event,
        path,
        metadata: JSON.stringify(metadata ?? {}),
      },
    });

    try { trackEvent(event === "purchase" ? "purchase_completed" : event as never, { path }); } catch { /* ignore */ }

    return NextResponse.json({ ok: true, tracked: true });
  } catch (err) {
    console.error("analytics track error:", err);
    return NextResponse.json({ ok: true, tracked: false });
  }
}
