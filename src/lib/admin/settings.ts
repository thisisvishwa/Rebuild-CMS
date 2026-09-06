import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

/**
 * Centralized system setting service.
 *
 * Settings are stored as key/value rows in `SystemSetting`, grouped by category.
 * They are the single source of truth for admin-editable business values, and
 * drive the storefront via the settings API. Environment variables are used as
 * fallbacks/overrides for credentials (which are never stored in the DB in
 * plaintext when avoidable — payment credentials are managed separately).
 */

export interface SettingDef {
  key: string;
  group: string;
  label: string;
  type: "string" | "number" | "boolean" | "json";
  default: string;
}

export const SETTING_DEFS: SettingDef[] = [
  // Business
  { key: "business.name", group: "business", label: "Business name", type: "string", default: config.app.productName },
  { key: "business.email", group: "business", label: "Support email", type: "string", default: config.email.support },
  { key: "business.logoUrl", group: "business", label: "Logo URL", type: "string", default: "" },
  { key: "business.address", group: "business", label: "Business address", type: "string", default: "" },
  { key: "business.phone", group: "business", label: "Phone", type: "string", default: "" },
  { key: "business.website", group: "business", label: "Website URL", type: "string", default: config.app.url },

  // Commerce
  { key: "commerce.currency", group: "commerce", label: "Currency", type: "string", default: config.price.currency },
  { key: "commerce.priceMinor", group: "commerce", label: "Product price (minor units)", type: "number", default: String(config.price.amountMinor) },
  { key: "commerce.taxEnabled", group: "commerce", label: "Tax enabled", type: "boolean", default: "false" },
  { key: "commerce.taxRatePercent", group: "commerce", label: "Tax rate (%)", type: "number", default: "0" },
  { key: "commerce.taxName", group: "commerce", label: "Tax name", type: "string", default: "Tax" },
  { key: "commerce.taxInclusive", group: "commerce", label: "Tax inclusive of price", type: "boolean", default: "true" },
  { key: "commerce.refundDays", group: "commerce", label: "Refund window (days)", type: "number", default: "14" },

  // Analytics
  { key: "analytics.retentionDays", group: "analytics", label: "Visitor retention (days)", type: "number", default: "30" },
  { key: "analytics.anonymizeIp", group: "analytics", label: "Anonymize IP addresses", type: "boolean", default: "true" },
  { key: "analytics.trackVisitors", group: "analytics", label: "Track visitors", type: "boolean", default: "true" },

  // Security
  { key: "security.mfaRequired", group: "security", label: "Require MFA for all admins", type: "boolean", default: "false" },
  { key: "security.sessionHours", group: "security", label: "Admin session hours", type: "number", default: "12" },
  { key: "security.requireStrongPasswords", group: "security", label: "Require strong passwords", type: "boolean", default: "true" },

  // Email / delivery
  { key: "email.fromName", group: "email", label: "Sender name", type: "string", default: config.app.productName },
  { key: "email.supportEmail", group: "email", label: "Support / reply-to email", type: "string", default: config.email.support },
  { key: "delivery.downloadTtlSeconds", group: "email", label: "Secure download link TTL (seconds)", type: "number", default: String(config.delivery.downloadTtl) },
  { key: "delivery.secureDownload", group: "email", label: "Require secure signed download links", type: "boolean", default: String(config.delivery.secure) },

  // Legal / compliance
  { key: "legal.businessName", group: "legal", label: "Legal business name", type: "string", default: config.app.productName },
  { key: "legal.businessAddress", group: "legal", label: "Business address", type: "string", default: "" },
  { key: "legal.privacyContact", group: "legal", label: "Privacy contact email", type: "string", default: config.email.support },
];

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (row) return row.value;
  const def = SETTING_DEFS.find((s) => s.key === key);
  return def?.default ?? "";
}

export async function getSettings(group?: string): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany({
    where: group ? { group } : undefined,
  });
  const map: Record<string, string> = {};
  for (const def of SETTING_DEFS) {
    const row = rows.find((r) => r.key === def.key);
    map[def.key] = row ? row.value : def.default;
  }
  return map;
}

export async function setSetting(key: string, value: string, adminId?: string) {
  const def = SETTING_DEFS.find((s) => s.key === key);
  const type = def?.type ?? "string";
  const exist = await prisma.systemSetting.findUnique({ where: { key } });
  const data = {
    value,
    type,
    group: def?.group ?? "general",
    label: def?.label ?? key,
    updatedById: adminId,
  };
  if (exist) {
    return prisma.systemSetting.update({ where: { key }, data });
  }
  return prisma.systemSetting.create({ data: { key, ...data } });
}

export async function setSettings(batch: Record<string, string>, adminId?: string) {
  const results = [];
  for (const [key, value] of Object.entries(batch)) {
    if (SETTING_DEFS.some((d) => d.key === key)) {
      results.push(await setSetting(key, value, adminId));
    }
  }
  return results;
}
