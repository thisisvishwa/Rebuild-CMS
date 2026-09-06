import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { buildPlaceholderPdf } from "@/lib/pdf";
import { trackEvent } from "@/lib/analytics";
import { getIp, enforceRateLimit } from "@/lib/api";

/**
 * GET /api/access/download?token=...
 * Serves the paid eBook only to a verified, still-valid access token tied to a
 * paid order. The token expires (default 15 minutes) so the asset isn't a
 * permanent public URL.
 */
export async function GET(req: NextRequest) {
  const rl = enforceRateLimit(req, `download:${getIp(req)}`);
  if (rl.limited) return rl.response;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "Missing access token." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const claims = await verifyAccessToken(token);
  if (!claims) {
    return new Response(JSON.stringify({ ok: false, error: "This access link is invalid or has expired. Request a new one via your confirmation email or contact support." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: claims.orderNumber,
      email: claims.email,
      status: "paid",
      accessGranted: true,
    },
  });

  if (!order) {
    return new Response(JSON.stringify({ ok: false, error: "Access not granted for this order." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If an explicit asset URL is configured, use it. Otherwise serve the
  // placeholder PDF so the flow is fully testable.
  if (config.delivery.ebookUrl) {
    return Response.redirect(config.delivery.ebookUrl, 302);
  }

  try {
    trackEvent("download_accessed", { orderNumber: order.orderNumber });
  } catch {
    /* ignore */
  }

  const pdf = buildPlaceholderPdf({
    orderNumber: order.orderNumber,
    title: `${config.app.productName} — Recovery Workbook`,
  });

  const filename = `rebuild-recovery-${order.orderNumber.toLowerCase()}.pdf`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
