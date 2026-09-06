import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { SETTING_DEFS, getSettings, setSettings } from "@/lib/admin/settings";
import { config } from "@/lib/config";

const GROUP_LABELS: Record<string, string> = {
  business: "Business", commerce: "Commerce", payments: "Payments",
  email: "Email & Delivery", storage: "Storage", analytics: "Analytics",
  security: "Security", legal: "Legal & Compliance",
};

/** GET /api/admin/settings */
export async function GET() {
  await requirePermission("settings:view");
  const values = await getSettings();
  const groups: Record<string, any> = {};
  for (const def of SETTING_DEFS) {
    const g = def.group;
    if (!groups[g]) groups[g] = { ...GROUP_LABELS[g] ? { label: GROUP_LABELS[g] } : { label: g }, fields: [] };
    groups[g].fields.push({ ...def, value: values[def.key] });
  }
  const providers = await prisma.paymentProvider.findMany({ select: { key: true, name: true, enabled: true, environment: true } });
  return NextResponse.json({
    ok: true,
    groups: Object.entries(groups).map(([key, g]: any) => ({ key, label: g.label, fields: g.fields })),
    env: {
      paymentMode: config.payment.mode,
      emailTransport: config.email.transport,
      analyticsProvider: config.analytics.provider,
      storage: "local-private",
      providers,
    },
  });
}

/** POST /api/admin/settings */
export async function POST(req: Request) {
  const ctx = await requirePermission("settings:manage");
  const body = await req.json().catch(() => null);
  const values: Record<string, string> = body?.values ?? {};
  if (!Object.keys(values).length) return NextResponse.json({ ok: false, error: "No values provided" }, { status: 400 });
  await setSettings(values, ctx.user.id);
  await logAudit({ userId: ctx.user.id, action: "SETTINGS_UPDATE", resource: "setting", after: { keys: Object.keys(values) } });
  return NextResponse.json({ ok: true });
}
