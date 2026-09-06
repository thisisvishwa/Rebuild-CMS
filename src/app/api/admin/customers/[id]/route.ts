import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/customers/:id — full customer detail. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requirePermission("customers:view");
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { invoice: true } },
      entitlements: { include: { product: true, version: true } },
      downloads: { orderBy: { createdAt: "desc" }, take: 20 },
      customerEvents: { orderBy: { createdAt: "desc" }, take: 20 },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, customer });
}

/** POST /api/admin/customers/:id — actions: note, revoke_access, restore_access, replace_version. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requirePermission("customers:manage");
  const body = await req.json().catch(() => null);
  const action = body?.action as string;

  if (action === "note") {
    const note = String(body?.note ?? "").slice(0, 2000);
    if (!note) return NextResponse.json({ ok: false, error: "Note required" }, { status: 400 });
    await prisma.customerNote.create({ data: { customerId: params.id, adminId: ctx.user.id, note } });
    await logAudit({ userId: ctx.user.id, action: "CUSTOMER_NOTE", resource: "customer", resourceId: params.id });
    return NextResponse.json({ ok: true });
  }

  if (action === "revoke_access") {
    const eid = String(body?.entitlementId ?? "");
    await prisma.entitlement.update({ where: { id: eid }, data: { status: "revoked" } });
    await prisma.accessLog.create({ data: { entitlementId: eid, customerId: params.id, action: "revoked", adminId: ctx.user.id } });
    await logAudit({ userId: ctx.user.id, action: "ACCESS_REVOKE", resource: "customer", resourceId: params.id, description: `Revoked entitlement ${eid}` });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore_access") {
    const eid = String(body?.entitlementId ?? "");
    await prisma.entitlement.update({ where: { id: eid }, data: { status: "active" } });
    await prisma.accessLog.create({ data: { entitlementId: eid, customerId: params.id, action: "restored", adminId: ctx.user.id } });
    await logAudit({ userId: ctx.user.id, action: "ACCESS_RESTORE", resource: "customer", resourceId: params.id });
    return NextResponse.json({ ok: true });
  }

  if (action === "replace_version") {
    const eid = String(body?.entitlementId ?? "");
    const versionId = String(body?.versionId ?? "");
    const reason = String(body?.reason ?? "");
    await prisma.replacement.create({ data: { entitlementId: eid, toVersionId: versionId, reason, adminId: ctx.user.id } });
    await prisma.entitlement.update({ where: { id: eid }, data: { versionId } });
    await prisma.accessLog.create({ data: { entitlementId: eid, customerId: params.id, action: "replaced", detail: reason, adminId: ctx.user.id } });
    await logAudit({ userId: ctx.user.id, action: "ACCESS_REPLACE_VERSION", resource: "customer", resourceId: params.id, description: `Replaced version for ${eid}` });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
