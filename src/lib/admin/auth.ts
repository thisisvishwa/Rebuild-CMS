import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { randomToken, sha256 } from "@/lib/admin/security";
import type { AdminUser, Role } from "@prisma/client";

/**
 * Admin authentication + authorization.
 *
 * Session model: an HttpOnly, SameSite=Lax, secure-in-prod cookie holds a random
 * token; the DB stores only its SHA-256 hash (so a leaked DB can't replay a
 * cookie). Sessions expire and are revocable. Super-admin bypasses RBAC.
 */

export const ADMIN_COOKIE = "rebuild_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export function deviceInfo(ua: string | null) {
  const s = ua ?? "";
  const device = /mobile|android|iphone/i.test(s)
    ? "Mobile"
    : /tablet|ipad/i.test(s)
      ? "Tablet"
      : "Desktop";
  const browser =
    /edg\//i.test(s) ? "Edge"
    : /chrome|chromium/i.test(s) ? "Chrome"
    : /safari/i.test(s) ? "Safari"
    : /firefox/i.test(s) ? "Firefox"
    : /opera/i.test(s) ? "Opera"
    : "Unknown";
  const os =
    /windows/i.test(s) ? "Windows"
    : /mac os|macintosh/i.test(s) ? "macOS"
    : /android/i.test(s) ? "Android"
    : /iphone|ios/i.test(s) ? "iOS"
    : /linux/i.test(s) ? "Linux"
    : "Unknown";
  return { device, browser, os };
}

/** Create a session and return the raw token (store only its hash). */
export async function createSession(
  userId: string,
  ip: string | null,
  userAgent: string | null,
  location?: string,
) {
  const token = randomToken(32);
  const info = deviceInfo(userAgent);
  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash: sha256(token),
      ip,
      userAgent,
      device: info.device,
      browser: info.browser,
      os: info.os,
      location,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      mfaVerified: true,
    },
  });
  return token;
}

export async function destroySessionByToken(token: string) {
  await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
}

export async function destroySessionsForUser(userId: string) {
  await prisma.adminSession.deleteMany({
    where: { userId, revoked: false },
  });
}

export async function revokeSession(id: string) {
  await prisma.adminSession.updateMany({
    where: { id },
    data: { revoked: true },
  });
}

export interface AuthContext {
  user: AdminUser;
  role: Role | null;
  permissions: Set<string>;
  isSuper: boolean;
  sessionId: string;
}

/** Resolve the current admin from the cookie, or null. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const jar = cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });

  if (!session || session.revoked || session.expiresAt < new Date()) {
    return null;
  }

  const user = session.user;
  const role = user.role;
  const isSuper = role?.isSuperRole ?? false;
  const permissions = new Set<string>(
    role?.permissions.map((rp) => rp.permission.key) ?? [],
  );

  // Touch last-seen occasionally (throttle to reduce writes).
  if (Date.now() - session.lastSeen.getTime() > 60_000) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { lastSeen: new Date() },
    });
  }

  return { user, role, permissions, isSuper, sessionId: session.id };
}

export function hasPermission(ctx: AuthContext, perm: string): boolean {
  return ctx.isSuper || ctx.permissions.has(perm);
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/admin/login");
  return ctx;
}

export async function requirePermission(perm: string): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!hasPermission(ctx, perm)) redirect("/admin?denied=permission");
  return ctx;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}
