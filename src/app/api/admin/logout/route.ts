import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, sessionCookieOptions, getClientIp } from "@/lib/admin/auth";
import { sha256 } from "@/lib/admin/security";
import { logAudit } from "@/lib/admin/audit";

/** GET /api/admin/logout — destroy the current session. */
export async function GET() {
  const jar = cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    const session = await prisma.adminSession.findUnique({ where: { tokenHash: sha256(token) } });
    if (session) {
      await prisma.adminSession.update({ where: { id: session.id }, data: { revoked: true } });
      await logAudit({ userId: session.userId, action: "LOGOUT", resource: "admin", description: "Admin signed out", ip: getClientIp(new Request("http://x")) });
    }
  }
  const res = NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"));
  res.cookies.set(ADMIN_COOKIE, "", sessionCookieOptions());
  return res;
}
