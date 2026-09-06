import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/admin/security";
import { createSession, sessionCookieOptions, getClientIp } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** POST /api/admin/mfa/verify — complete MFA login for a pending user. */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const jar = cookies();
  const pending = jar.get("rebuild_admin_mfa_pending")?.value;
  if (!pending) {
    return NextResponse.json({ ok: false, error: "Your login session expired. Please sign in again." }, { status: 401 });
  }

  const userId = Buffer.from(pending, "base64url").toString("utf8");
  const body = await req.json().catch(() => null);
  const parsed = z.object({ code: z.string().min(6).max(6) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter your 6-digit code." }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ ok: false, error: "MFA is not enabled for this account." }, { status: 400 });
  }

  if (!verifyTotp(user.mfaSecret, parsed.data.code)) {
    await logAudit({ userId, action: "MFA_FAILED", resource: "admin", description: "Invalid MFA code", ip, userAgent: req.headers.get("user-agent") });
    return NextResponse.json({ ok: false, error: "Invalid code. Try again." }, { status: 401 });
  }

  const token = await createSession(user.id, ip, req.headers.get("user-agent"));
  const res = NextResponse.json({ ok: true, redirect: "/admin" });
  res.cookies.set("rebuild_admin_session", token, sessionCookieOptions());
  res.cookies.set("rebuild_admin_mfa_pending", "", { path: "/", maxAge: 0 });
  await logAudit({ userId: user.id, action: "LOGIN", resource: "admin", description: `Admin ${user.email} logged in (MFA)`, ip });

  return res;
}
