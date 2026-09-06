import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/admin/auth";
import { verifyAccessToken } from "@/lib/access";
import { readPrivateFile } from "@/lib/admin/storage";

/**
 * GET /api/media/:name
 * Serves a private media/eBook file only to:
 *   - an authenticated admin, OR
 *   - a customer with a valid signed access token that maps to a paid entitlement
 *     (for eBook/PDF media).
 * Never serves private content to the public.
 */
export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  const name = params.name;
  const media = await prisma.media.findUnique({ where: { filename: name } });
  if (!media) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  // Admin access.
  const admin = await getAuthContext();
  if (admin) {
    return serveFile(media.path);
  }

  // Customer access via signed token (streamed for eBook/media).
  const token = req.nextUrl.searchParams.get("token");
  if (token && media.kind !== "image") {
    const claims = await verifyAccessToken(token);
    if (claims) {
      const entitlement = await prisma.entitlement.findFirst({
        where: { customer: { email: claims.email }, status: "active" },
        include: { version: true },
      });
      if (entitlement && (entitlement.version?.mediaId === media.id)) {
        await prisma.download.create({
          data: { customerId: entitlement.customerId, entitlementId: entitlement.id, productId: entitlement.productId, versionId: entitlement.versionId, ip: req.headers.get("x-forwarded-for")?.split(",")[0], userAgent: req.headers.get("user-agent"), status: "success" },
        });
        return serveFile(media.path);
      }
    }
  }

  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

async function serveFile(storedPath: string) {
  try {
    const { buf, contentType, basename } = await readPrivateFile(storedPath);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${basename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "File unavailable" }, { status: 404 });
  }
}
