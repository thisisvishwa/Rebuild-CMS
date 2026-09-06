import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { randomToken, sha256 } from "@/lib/admin/security";
import { z } from "zod";

const API_KEY_PREFIX = "rb_live_";

function maskKey(hash: string) { return hash.slice(0, 8) + "••••••••"; }

/** GET /api/admin/api — API keys + webhooks. */
export async function GET() {
  await requirePermission("system:view");
  const keys = await prisma.adminApiKey.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } });
  const webhooks = await prisma.paymentWebhook.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ ok: true, keys: keys.map((k) => ({ ...k, keyHash: maskKey(k.keyHash) })), webhooks });
}

/** POST /api/admin/api — create API key (returns plaintext once), toggle, delete. */
export async function POST(req: Request) {
  const ctx = await requirePermission("system:manage");
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "create") {
    const parsed = z.object({ name: z.string().min(1), scopes: z.array(z.string()).default([]), expiresAt: z.string().nullable().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
    const plain = API_KEY_PREFIX + randomToken(24);
    const key = await prisma.adminApiKey.create({
      data: { userId: ctx.user.id, name: parsed.data.name, keyHash: sha256(plain), scopes: JSON.stringify(parsed.data.scopes), expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null },
    });
    await logAudit({ userId: ctx.user.id, action: "API_KEY_CREATE", resource: "api_key", resourceId: key.id, after: { name: parsed.data.name } });
    return NextResponse.json({ ok: true, id: key.id, key: plain, note: "Copy this key now — it is shown only once." });
  }

  if (body?.id) {
    if (action === "toggle") {
      await prisma.adminApiKey.update({ where: { id: body.id }, data: { isActive: !!body.isActive } });
      await logAudit({ userId: ctx.user.id, action: body.isActive ? "API_KEY_ACTIVATE" : "API_KEY_DEACTIVATE", resource: "api_key", resourceId: body.id });
      return NextResponse.json({ ok: true });
    }
    if (action === "delete") {
      await prisma.adminApiKey.delete({ where: { id: body.id } });
      await logAudit({ userId: ctx.user.id, action: "API_KEY_DELETE", resource: "api_key", resourceId: body.id });
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
