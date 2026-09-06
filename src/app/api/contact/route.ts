import { prisma } from "@/lib/prisma";
import { contactFormSchema } from "@/lib/validation";
import { errorResponse, parseBody, enforceRateLimit, getIp } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { config } from "@/lib/config";

/**
 * POST /api/contact
 * Receives a support message. It is stored (so nothing is lost even without
 * SMTP) and, when SMTP is configured, forwarded to the support inbox. We never
 * ask for or store sensitive emotional/health details beyond a support message.
 */
export async function POST(req: Request) {
  const rl = enforceRateLimit(req, `contact:${getIp(req)}`);
  if (rl.limited) return rl.response;

  try {
    const v = await parseBody(req, contactFormSchema);

    const saved = await prisma.contactMessage.create({
      data: {
        name: v.name,
        email: v.email,
        orderNumber: v.orderNumber || null,
        subject: v.subject,
        message: v.message,
      },
    });

    if (config.email.transport === "smtp") {
      await sendEmail({
        to: config.email.support,
        subject: `Support: ${v.subject}`,
        text: `From: ${v.name} <${v.email}>\nOrder: ${v.orderNumber || "n/a"}\n\n${v.message}`,
        html: `<p><strong>From:</strong> ${v.name} &lt;${v.email}&gt;</p><p><strong>Order:</strong> ${v.orderNumber || "n/a"}</p><p>${v.message}</p>`,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        id: saved.id,
        message: "Thanks — your message has been received. We'll get back to you soon.",
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err, "contact");
  }
}
