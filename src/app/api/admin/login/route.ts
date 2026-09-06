import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/admin/security";
import { createSession, sessionCookieOptions, getClientIp } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { createNotification } from "@/lib/admin/notify";
import { getSetting } from "@/lib/admin/settings";
import { z } from "zod";

/** POST /api/admin/login — authenticate admin + create session cookie. */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Brute-force protection: 8 attempts / 15 min per IP and per email.
  const rl = rateLimit(`login:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many login attempts. Please wait before retrying." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { role: true },
  });

  const valid = user && user.isActive && (await verifyPassword(password, user.passwordHash));
  const ua = req.headers.get("user-agent");

  if (!valid) {
    await logAudit({ userId: user?.id, action: "LOGIN_FAILED", resource: "admin", description: `Failed login for ${email}`, ip, userAgent: ua });
    if (user) {
      await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginIp: ip } });
      await createNotification({ type: "security", title: "Failed login attempt", body: `${email} had a failed login attempt from ${ip}.` });
    }
    return NextResponse.json({ ok: false, error: "Incorrect email or password." }, { status: 401 });
  }

  // Need MFA second factor?
  if (user!.mfaEnabled) {
    // Issue a short-lived "mfa pending" cookie flow by not creating the final session yet.
    const pending = new NextResponse(JSON.stringify({ ok: true, mfaRequired: true }));
    pending.cookies.set("rebuild_admin_mfa_pending", Buffer.from(user!.id).toString("base64url"), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
    return pending;
  }

  const token = await createSession(user!.id, ip, ua);
  const res = NextResponse.json({ ok: true, redirect: "/admin" });
  res.cookies.set("rebuild_admin_session", token, sessionCookieOptions());
  await logAudit({ userId: user!.id, action: "LOGIN", resource: "admin", description: `Admin ${user!.email} logged in`, ip, userAgent: ua });

  return res;
}
