import nodemailer from "nodemailer";
import { config } from "@/lib/config";
import { formatMoney } from "@/lib/utils";
import type { AccessClaims } from "@/lib/access";
import { buildAccessUrl, signAccessToken } from "@/lib/access";

/**
 * Transactional email delivery.
 *
 * Two transports are supported:
 *  - "console": prints the email to the server log (default for development).
 *  - "smtp":    sends real email via nodemailer using SMTP env variables.
 *
 * Emails sent are transactional only (order confirmation, digital access,
 * getting started). We do not send manipulative emotional marketing emails.
 */

export type EmailData = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface OrderEmailContext {
  to: string;
  productName: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  accessUrl: string;
  supportEmail: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function baseHtml(title: string, body: string, footer: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin:0; background:#F9F4EB; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#2C2A26; }
      .wrap { max-width:560px; margin:0 auto; padding:32px 20px; }
      .card { background:#ffffff; border-radius:16px; padding:32px; border:1px solid #E5D8C2; }
      h1 { font-family:Georgia,serif; font-weight:600; font-size:24px; margin:0 0 8px; color:#211F1B; }
      p { line-height:1.6; margin:0 0 16px; font-size:15px; }
      .btn { display:inline-block; margin-top:8px; background:#7E6526; color:#fff !important; padding:12px 22px; border-radius:10px; text-decoration:none; font-weight:600; }
      .muted { color:#8A867D; font-size:13px; line-height:1.6; }
      .footer { margin-top:24px; font-size:12px; color:#A7A39A; text-align:center; }
      .rule { height:1px; background:#EDF0EA; margin:20px 0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>${esc(title)}</h1>
        <div>${body}</div>
        <div class="rule"></div>
        <div class="muted">${esc(footer)}</div>
      </div>
      <div class="footer">Rebuild · A self-guided recovery system</div>
    </div>
  </body>
</html>`;
}

async function deliver(email: EmailData): Promise<void> {
  if (config.email.transport === "smtp") {
    const transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: config.email.smtp.user
        ? { user: config.email.smtp.user, pass: config.email.smtp.pass }
        : undefined,
    });
    await transporter.sendMail({
      from: config.email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return;
  }

  // Console transport: log to the server output so you can verify the flow
  // locally without any SMTP credentials.
  console.log(
    `\n[EMAIL:console] To: ${email.to}\n[EMAIL:console] Subject: ${email.subject}\n${email.text}\n`,
  );
}

export async function sendEmail(email: EmailData): Promise<void> {
  await deliver(email);
}

export async function emailForPurchaseConfirmation(ctx: OrderEmailContext) {
  const amount = formatMoney(ctx.amountMinor, ctx.currency);
  const body = `
    <p>Hi,</p>
    <p>Thank you for your purchase of <b>${esc(ctx.productName)}</b>. Your order has been received and confirmed.</p>
    <p><b>Order number:</b> ${esc(ctx.orderNumber)}<br/><b>Amount:</b> ${esc(amount)}</p>
    <p>Your digital access and getting-started instructions will follow by email.</p>
    <p>We're glad you're here.</p>`;

  return {
    to: ctx.to,
    subject: `Your ${ctx.productName} order — confirmed`,
    text: `Thank you for your purchase of ${ctx.productName}. Order ${ctx.orderNumber} confirmed for ${amount}. Access instructions will follow by email.`,
    html: baseHtml("Your order is confirmed", body, `Questions? Contact ${ctx.supportEmail}`),
  } satisfies EmailData;
}

export async function emailForDigitalAccess(ctx: OrderEmailContext) {
  const body = `
    <p>Hi,</p>
    <p>Your digital copy of <b>${esc(ctx.productName)}</b> is ready. Use the button below to open your private access page. This link is secure and expires for your protection.</p>
    <p style="text-align:center;"><a class="btn" href="${esc(ctx.accessUrl)}">Access your eBook</a></p>
    <p class="muted">If the link has expired, or you need help, just reply or contact ${esc(ctx.supportEmail)} with your order number (${esc(ctx.orderNumber)}).</p>`;

  return {
    to: ctx.to,
    subject: `Your ${ctx.productName} digital access`,
    text: `Access your copy of ${ctx.productName}: ${ctx.accessUrl}. Order ${ctx.orderNumber}. This link expires for security. Contact ${ctx.supportEmail} if you need help.`,
    html: baseHtml("Your ebook is ready", body, `Order ${ctx.orderNumber}`),
  } satisfies EmailData;
}

export async function emailForGettingStarted(ctx: OrderEmailContext) {
  const body = `
    <p>Hi,</p>
    <p>Welcome to the start of your recovery journey with <b>${esc(ctx.productName)}</b>.</p>
    <p>Here's a simple way to begin: find a quiet few minutes, open the first chapter, and just read a little. There's no right speed — you move at the pace that feels right for you. Start small, stay gentle with yourself, and return to it whenever you need.</p>
    <p>You're not alone in this. One step at a time.</p>`;

  return {
    to: ctx.to,
    subject: `Getting started with ${ctx.productName}`,
    text: `Welcome to ${ctx.productName}. Take it one small step at a time, at your own pace. You're not alone — one step at a time.`,
    html: baseHtml("Let's take the first step", body, `Order ${ctx.orderNumber} · Contact ${ctx.supportEmail}`),
  } satisfies EmailData;
}

/**
 * Send the full post-purchase email sequence for a verified order.
 * (Builds and sends all three transactional emails.)
 */
export async function sendPurchaseEmails(
  ctx: OrderEmailContext,
): Promise<void> {
  const confirmation = await emailForPurchaseConfirmation(ctx);
  await sendEmail(confirmation);

  const access = await emailForDigitalAccess(ctx);
  await sendEmail(access);

  const start = await emailForGettingStarted(ctx);
  await sendEmail(start);
}

export function buildAccessUrlForOrder(
  claims: AccessClaims,
): Promise<string> {
  return signAccessToken(claims).then(buildAccessUrl);
}
