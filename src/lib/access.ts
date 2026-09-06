import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { config } from "@/lib/config";

/**
 * Signed, expiring access tokens for secure digital delivery.
 *
 * We never expose a permanent public URL for the paid eBook. Instead, after a
 * verified purchase we issue a short-lived signed token (JWT) that grants
 * access to the download endpoint. This prevents casual, unauthorised access
 * and lets links expire. The signing secret is held server-side only.
 */

const secretKey = () =>
  new TextEncoder().encode(config.delivery.accessSecret);

export interface AccessClaims {
  orderNumber: string;
  email: string;
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT(claims as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("rebuild")
    .setAudience("rebuild-customer")
    .setExpirationTime(`${config.delivery.downloadTtl}s`)
    .sign(secretKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "rebuild",
      audience: "rebuild-customer",
    });
    if (
      typeof payload.orderNumber === "string" &&
      typeof payload.email === "string"
    ) {
      return { orderNumber: payload.orderNumber, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Build the absolute access URL for a given order. When secure delivery is
 * enabled the link carries an expiring token; otherwise it points at the
 * configured (public) asset URL. Callers choose based on config at runtime.
 */
export function buildAccessUrl(token: string): string {
  return `${config.app.url}/access?token=${encodeURIComponent(token)}`;
}
