import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getClientIp } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { z } from "zod";

/** GET /api/admin/email?tab=logs */
export async function GET(req: Request) {
  await requirePermission("email:view");
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "templates";

  if (tab === "logs") {
    const logs = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ ok: true, logs });
  }

  const templates = await prisma.emailTemplate.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ ok: true, templates });
}

/** POST /api/admin/email — update template or queue a test email. */
export async function POST(req: Request) {
  const ctx = await requirePermission("email:manage");
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "updateTemplate") {
    const parsed = z.object({ id: z.string(), subject: z.string(), body: z.string(), isActive: z.boolean() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid template" }, { status: 400 });
    await prisma.emailTemplate.update({ where: { id: parsed.data.id }, data: { subject: parsed.data.subject, body: parsed.data.body, isActive: parsed.data.isActive } });
    await logAudit({ userId: ctx.user.id, action: "EMAIL_TEMPLATE_UPDATE", resource: "email_template", resourceId: parsed.data.id });
    return NextResponse.json({ ok: true });
  }

  if (action === "test") {
    const parsed = z.object({ id: z.string(), to: z.string().email() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid recipient" }, { status: 400 });
    const t = await prisma.emailTemplate.findUnique({ where: { id: parsed.data.id } });
    if (!t) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });

    const { sendEmail } = await import("@/lib/email");
    const text = t.body.replace(/\{\{[a-zA-Z_]+\}\}/g, "test").trim();
    let ok = false;
    try {
      await sendEmail({ to: parsed.data.to, subject: t.subject.replace(/\{\{[a-zA-Z_]+\}\}/g, "test"), text, html: t.html ? `<pre>${text}</pre>` : undefined });
      ok = true;
      await prisma.emailLog.create({ data: { to: parsed.data.to, template: t.key, subject: t.subject, provider: process.env.EMAIL_TRANSPORT === "smtp" ? "smtp" : "console", status: "sent" } });
    } catch (e) {
      await prisma.emailLog.create({ data: { to: parsed.data.to, template: t.key, subject: t.subject, provider: "smtp", status: "failed", error: e instanceof Error ? e.message : "Send failed" } });
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Could not send test email" }, { status: 500 });
    }
    await logAudit({ userId: ctx.user.id, action: "EMAIL_TEST_SENT", resource: "email_template", resourceId: t.id, ip: getClientIp(req) });
    return NextResponse.json({ ok: true, message: `Test "${t.name}" ${ok ? "sent" : ""} to ${parsed.data.to}.` });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
