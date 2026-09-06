import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { hashPassword, randomToken, sha256, passwordIsStrong } from "@/lib/admin/security";
import { z } from "zod";

/** GET /api/admin/users */
export async function GET() {
  await requirePermission("admin:view");
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    include: { role: { select: { name: true, key: true } }, sessions: { select: { id: true, createdAt: true, lastSeen: true } } },
  });
  const sanitized = users.map((u) => ({ ...u, passwordHash: undefined, mfaSecret: undefined, mfaRecovery: undefined }));
  return NextResponse.json({ ok: true, users: sanitized });
}

/** POST /api/admin/users — create user, reset password, toggle active, set role, enable/disable MFA. */
export async function POST(req: Request) {
  const ctx = await requirePermission("admin:manage");
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "create") {
    const parsed = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), roleId: z.string().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid user data" }, { status: 400 });
    const p = parsed.data;
    if (!passwordIsStrong(p.password)) return NextResponse.json({ ok: false, error: "Password too weak" }, { status: 400 });
    const exists = await prisma.adminUser.findUnique({ where: { email: p.email } });
    if (exists) return NextResponse.json({ ok: false, error: "Email already in use" }, { status: 409 });
    const user = await prisma.adminUser.create({ data: { name: p.name, email: p.email, passwordHash: await hashPassword(p.password), roleId: p.roleId } });
    await logAudit({ userId: ctx.user.id, action: "ADMIN_CREATE", resource: "admin_user", resourceId: user.id, after: { email: p.email } });
    return NextResponse.json({ ok: true, id: user.id, tempPasswordSent: false });
  }

  if (body?.id) {
    const user = await prisma.adminUser.findUnique({ where: { id: body.id } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    if (action === "resetPassword") {
      if (!passwordIsStrong(body.password)) return NextResponse.json({ ok: false, error: "Password too weak" }, { status: 400 });
      await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.password), mustResetPwd: true } });
      await prisma.adminSession.deleteMany({ where: { userId: user.id } });
      await logAudit({ userId: ctx.user.id, action: "ADMIN_PASSWORD_RESET", resource: "admin_user", resourceId: user.id, before: { email: user.email } });
      return NextResponse.json({ ok: true });
    }
    if (action === "toggleActive") {
      await prisma.adminUser.update({ where: { id: user.id }, data: { isActive: body.isActive } });
      if (!body.isActive) await prisma.adminSession.deleteMany({ where: { userId: user.id } });
      await logAudit({ userId: ctx.user.id, action: body.isActive ? "ADMIN_ACTIVATE" : "ADMIN_DEACTIVATE", resource: "admin_user", resourceId: user.id });
      return NextResponse.json({ ok: true });
    }
    if (action === "setRole") {
      await prisma.adminUser.update({ where: { id: user.id }, data: { roleId: body.roleId || null } });
      await logAudit({ userId: ctx.user.id, action: "ADMIN_ROLE_CHANGE", resource: "admin_user", resourceId: user.id, before: { role: user.roleId }, after: { role: body.roleId } });
      return NextResponse.json({ ok: true });
    }
    if (action === "toggleMfa") {
      await prisma.adminUser.update({ where: { id: user.id }, data: { mfaEnabled: body.enabled } });
      await logAudit({ userId: ctx.user.id, action: body.enabled ? "ADMIN_MFA_ENABLE" : "ADMIN_MFA_DISABLE", resource: "admin_user", resourceId: user.id });
      return NextResponse.json({ ok: true });
    }
    if (action === "revokeSessions") {
      await prisma.adminSession.deleteMany({ where: { userId: user.id } });
      await logAudit({ userId: ctx.user.id, action: "ADMIN_SESSIONS_REVOKED", resource: "admin_user", resourceId: user.id });
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
