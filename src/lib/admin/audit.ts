import { prisma } from "@/lib/prisma";

/**
 * Audit logging for all sensitive admin actions.
 * This is the immutable trail: logins, price changes, provider toggles, refunds,
 * access changes, CMS publishes, security changes, etc.
 */
export interface AuditInput {
  userId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  description?: string;
  ip?: string | null;
  userAgent?: string | null;
  before?: unknown;
  after?: unknown;
}

export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        resource: input.resource ?? "general",
        resourceId: input.resourceId ?? null,
        description: input.description ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        before: input.before !== undefined ? JSON.stringify(input.before) : null,
        after: input.after !== undefined ? JSON.stringify(input.after) : null,
      },
    });
  } catch (err) {
    // Audit logging must never break the primary action.
    console.error("audit log failed:", err);
  }
}
