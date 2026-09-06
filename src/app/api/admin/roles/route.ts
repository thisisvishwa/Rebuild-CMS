import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";

/** GET /api/admin/roles */
export async function GET() {
  await requirePermission("admin:view");
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: "asc" },
    include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
  });
  const permissions = await prisma.permission.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
  return NextResponse.json({
    ok: true,
    roles: roles.map((r) => ({ ...r, permissionKeys: r.permissions.map((p) => p.permission.key) })),
    permissions,
  });
}

/** POST /api/admin/roles — update a role's permissions (system roles editable, super_admin locked). */
export async function POST(req: Request) {
  const ctx = await requirePermission("admin:manage");
  const body = await req.json().catch(() => null);
  const id = body?.id;
  const permissionKeys: string[] = Array.isArray(body?.permissionKeys) ? body.permissionKeys : [];

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ ok: false, error: "Role not found" }, { status: 404 });
  if (role.isSuperRole) return NextResponse.json({ ok: false, error: "Super admin role cannot be edited" }, { status: 400 });
  if (role.isSystem && body?.name && body.name !== role.name) {
    // Allow limited name/description edits on system roles.
  }

  const perms = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
  // Replace role permissions.
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  if (perms.length) {
    await prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId: id, permissionId: p.id })) });
  }
  const data: any = {};
  if (body?.name) data.name = body.name;
  if (body?.description !== undefined) data.description = body.description;
  if (Object.keys(data).length) await prisma.role.update({ where: { id: body.id }, data });

  await logAudit({ userId: ctx.user.id, action: "ROLE_UPDATE", resource: "role", resourceId: id, after: { permissionKeys } });
  return NextResponse.json({ ok: true });
}
