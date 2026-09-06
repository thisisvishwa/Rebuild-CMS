import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { encryptSecret, decryptSecret } from "@/lib/admin/crypto";
import { z } from "zod";

const PROVIDER_KEYS = new Set(["razorpay", "paypal", "wise"]);

function redact(p: any) {
  return {
    ...p,
    testSecret: p.testSecret ? (p.testSecret.startsWith("v1:") ? "••••encrypted••••" : "") : "",
    liveSecret: p.liveSecret ? (p.liveSecret.startsWith("v1:") ? "••••encrypted••••" : "") : "",
  };
}

/** GET /api/admin/payment-providers */
export async function GET() {
  await requirePermission("payments:manage");
  const providers = await prisma.paymentProvider.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ ok: true, providers: providers.map(redact), encryptionKeySet: true });
}

/** POST /api/admin/payment-providers — update provider config (encrypts secrets). */
export async function POST(req: Request) {
  const ctx = await requirePermission("payments:manage");
  const body = await req.json().catch(() => null);
  const expected = ["razorpay", "paypal", "wise"];
  if (!expected.includes(body?.key)) return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 400 });

  const key = body.key;
  const current = await prisma.paymentProvider.findUnique({ where: { key } });
  if (!current) return NextResponse.json({ ok: false, error: "Provider not found" }, { status: 404 });

  const env = body.environment === "live" ? "live" : "sandbox";
  const schema = z.object({
    enabled: z.boolean().optional(),
    environment: z.enum(["sandbox", "live"]).optional(),
    showOnCheckout: z.boolean().optional(),
    testKey: z.string().optional(), testSecret: z.string().optional(),
    liveKey: z.string().optional(), liveSecret: z.string().optional(),
    notes: z.string().optional(),
  });
  const parsed = schema.parse(body);

  const data: any = {};
  if (parsed.enabled !== undefined) data.enabled = parsed.enabled;
  if (parsed.environment !== undefined) data.environment = env;
  if (parsed.showOnCheckout !== undefined) data.showOnCheckout = parsed.showOnCheckout;
  if (parsed.notes !== undefined) data.notes = parsed.notes;

  // When user submits new credentials, encrypt them; empty string clears them.
  if (parsed.testKey !== undefined) data.testKey = parsed.testKey;
  if (parsed.testSecret !== undefined) data.testSecret = parsed.testSecret ? encryptSecret(parsed.testSecret) : null;
  if (parsed.liveKey !== undefined) data.liveKey = parsed.liveKey;
  if (parsed.liveSecret !== undefined) data.liveSecret = parsed.liveSecret ? encryptSecret(parsed.liveSecret) : null;

  data.updatedById = ctx.user.id;
  const before = { enabled: current.enabled, environment: current.environment, showOnCheckout: current.showOnCheckout };
  const updated = await prisma.paymentProvider.update({ where: { key }, data });
  await logAudit({
    userId: ctx.user.id, action: "PAYMENT_PROVIDER_UPDATE", resource: "payment_provider", resourceId: key,
    before, after: { enabled: updated.enabled, environment: updated.environment, showOnCheckout: updated.showOnCheckout },
  });

  return NextResponse.json({ ok: true, provider: redact(updated) });
}

/** Resolve an actual secret for the given provider/env — used internally for live reconciliation. */
async function resolveSecret(providerKey: string, env: "sandbox" | "live") {
  const p = await prisma.paymentProvider.findUnique({ where: { key: providerKey } });
  if (!p) return null;
  const secret = env === "live" ? p.liveSecret : p.testSecret;
  try {
    return secret ? decryptSecret(secret) : null;
  } catch {
    return null;
  }
}
