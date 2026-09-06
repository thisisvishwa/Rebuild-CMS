import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getClientIp } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { generateTotpSecret, otpauthUrl, generateRecoveryCodes, hashRecoveryCode, verifyTotp } from "@/lib/admin/security";
import { setSetting } from "@/lib/admin/settings";

/** GET /api/admin/security */
export async function GET(req: Request) {
  const ctx = await requirePermission("security:manage");
  const url = new URL(req.url);
  const includePasswords = url.searchParams.get("includePasswords");

  const mfaPolicy = await prisma.systemSetting.findUnique({ where: { key: "security.mfaRequired" } });
  const sessionHours = await prisma.systemSetting.findUnique({ where: { key: "security.sessionHours" } });
  const activeSessions = await prisma.adminSession.findMany({ where: { revoked: false, expiresAt: { gt: new Date() } }, include: { user: { select: { name: true, email: true } } }, orderBy: { lastSeen: "desc" }, take: 50 });

  const me = await prisma.adminUser.findUnique({ where: { id: ctx.user.id } });
  let mfaSetup: any = null;
  if (!me?.mfaEnabled) {
    const secret = generateTotpSecret();
    mfaSetup = { secret, otpauth: otpauthUrl(secret, me?.email ?? "", "Rebuild Admin") };
  }

  return NextResponse.json({
    ok: true,
    policy: { mfaRequired: mfaPolicy?.value === "true", sessionHours: Number(sessionHours?.value ?? 12) },
    me: { email: me?.email, name: me?.name, mfaEnabled: !!me?.mfaEnabled, recoveryCodesActive: !!me?.mfaRecovery },
    mfaSetup,
    activeSessions: activeSessions.length,
    sessions: activeSessions,
  });
}

/** POST /api/admin/security — update policy, enable MFA, revoke sessions. */
export async function POST(req: Request) {
  const ctx = await requirePermission("security:manage");
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "policy") {
    await setSetting("security.mfaRequired", String(!!body.mfaRequired), ctx.user.id);
    if (body.sessionHours) await setSetting("security.sessionHours", String(Math.max(1, Math.min(72, Number(body.sessionHours)))), ctx.user.id);
    await logAudit({ userId: ctx.user.id, action: "SECURITY_POLICY_UPDATE", resource: "security", after: { mfaRequired: !!body.mfaRequired, sessionHours: Number(body.sessionHours) } });
    return NextResponse.json({ ok: true });
  }

  if (action === "enableMfa") {
    const me = await prisma.adminUser.findUnique({ where: { id: ctx.user.id } });
    if (!me) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (me.mfaEnabled) return NextResponse.json({ ok: false, error: "Already enabled" }, { status: 400 });
    if (!verifyTotp(body.secret, body.code)) return NextResponse.json({ ok: false, error: "Invalid 2FA code" }, { status: 400 });
    const recovery = generateRecoveryCodes(10);
    await prisma.adminUser.update({ where: { id: me.id }, data: { mfaEnabled: true, mfaSecret: body.secret, mfaRecovery: JSON.stringify(recovery.map(hashRecoveryCode)) } });
    await logAudit({ userId: ctx.user.id, action: "ADMIN_MFA_ENABLED", resource: "admin_user", resourceId: me.id, ip: getClientIp(req) });
    return NextResponse.json({ ok: true, recoveryCodes: recovery });
  }

  if (action === "disableMfa") {
    await prisma.adminUser.update({ where: { id: ctx.user.id }, data: { mfaEnabled: false, mfaSecret: null, mfaRecovery: "[]" } });
    await logAudit({ userId: ctx.user.id, action: "ADMIN_MFA_DISABLED", resource: "admin_user", resourceId: ctx.user.id, ip: getClientIp(req) });
    return NextResponse.json({ ok: true });
  }

  if (action === "revokeSession" && body.sessionId) {
    await prisma.adminSession.update({ where: { id: body.sessionId }, data: { revoked: true } });
    await logAudit({ userId: ctx.user.id, action: "ADMIN_SESSION_REVOKE", resource: "admin_session", resourceId: body.sessionId });
    return NextResponse.json({ ok: true });
  }

  if (action === "revokeAll") {
    await prisma.adminSession.updateMany({ where: { revoked: false, userId: { not: ctx.user.id } }, data: { revoked: true } });
    await logAudit({ userId: ctx.user.id, action: "ADMIN_ALL_SESSIONS_REVOKED", resource: "security" });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
