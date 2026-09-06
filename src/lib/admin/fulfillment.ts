import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { logAudit } from "@/lib/admin/audit";
import { sendEmail, buildAccessUrlForOrder } from "@/lib/email";
import { trackEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/admin/notify";

/**
 * The post-payment automation pipeline (§36, §81).
 *
 * A single, idempotent entry point that runs after a verified payment:
 *   1. Upsert customer
 *   2. Link order -> customer + product
 *   3. Create invoice (unique auto-numbered)
 *   4. Create entitlement + secure access token
 *   5. Build access URL
 *   6. Send purchase confirmation, invoice + access emails (template-driven)
 *   7. Record analytics conversion
 *   8. Create admin notification + audit log
 *
 * Every step is idempotent so webhook/verify retries never double-fulfil.
 */

function nextInvoiceNumber(seq: number, currencyYear: string): string {
  return `INV-${currencyYear}-${String(seq).padStart(6, "0")}`;
}

export async function ensureCustomer(email: string, name: string, country?: string) {
  const normalized = email.toLowerCase().trim();
  return prisma.customer.upsert({
    where: { email: normalized },
    update: { name: name || undefined, country: country || undefined },
    create: { email: normalized, name, country },
  });
}

export async function issueInvoice(orderId: string, adminId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found for invoice");
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;

  // Auto-increment invoice number using a counter on the year.
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
  });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  const number = nextInvoiceNumber(seq, String(year));

  const tax = order.taxMinor;
  const total = order.amountMinor;
  return prisma.invoice.create({
    data: {
      number,
      orderId,
      customerId: order.customerId,
      amountMinor: total - tax,
      taxMinor: tax,
      discountMinor: order.discountMinor,
      totalMinor: total,
      currency: order.currency,
      status: order.status === "paid" ? "paid" : order.status === "pending" ? "pending" : "unpaid",
    },
  });
}

export async function createEntitlement(orderId: string, adminId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { include: { versions: { where: { status: "active" }, orderBy: { uploadedAt: "desc" }, take: 1 } } } },
  });
  if (!order || !order.customerId) throw new Error("Order or customer missing");
  const existing = await prisma.entitlement.findFirst({ where: { orderId, productId: order.productId ?? undefined } });
  if (existing) return existing;

  // Resolve a product id; if the order wasn't linked to a specific product,
  // use the product the order points to (or skip — never create a dangling FK).
  const resolvedProductId = order.productId ?? order.product?.id ?? null;
  if (!resolvedProductId) {
    throw new Error("Order not linked to a product; cannot issue entitlement.");
  }

  const activeVersion = order.product?.versions?.[0];
  const entitlement = await prisma.entitlement.create({
    data: {
      customerId: order.customerId,
      orderId: order.id,
      productId: resolvedProductId,
      versionId: activeVersion?.id,
      status: "active",
      grantedById: adminId ?? null,
    },
  });

  await prisma.accessLog.create({
    data: {
      entitlementId: entitlement.id,
      customerId: order.customerId,
      orderId: order.id,
      action: "access_granted",
      adminId: adminId ?? null,
    },
  });

  await prisma.customerEvent.create({
    data: { customerId: order.customerId, type: "access_granted", payload: JSON.stringify({ orderId: order.id, entitlementId: entitlement.id }) },
  });

  return entitlement;
}

/**
 * Record the confirmed payment transaction. Idempotent per order so retries
 * never double-count a payment. Sets the order's paymentId for traceability.
 */
export async function recordConfirmedPayment(orderId: string, provider?: string, extra: { providerPaymentId?: string; providerOrderId?: string; method?: string; environment?: string } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found for payment");

  const existing = await prisma.payment.findFirst({ where: { orderId } });
  if (existing) return existing;

  const environment = extra.environment ?? (process.env.PAYMENT_MODE === "live" ? "live" : "sandbox");
  const payment = await prisma.payment.create({
    data: {
      orderId,
      provider: provider ?? order.method ?? "demo",
      providerPaymentId: extra.providerPaymentId ?? order.providerReference ?? null,
      providerOrderId: extra.providerOrderId ?? null,
      amountMinor: order.amountMinor,
      currency: order.currency,
      status: "captured",
      method: extra.method ?? order.method ?? null,
      environment,
      receipt: order.orderNumber,
      raw: JSON.stringify({ confirmed: true, source: "fulfillment" }),
    },
  });

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { paymentId: payment.id } }),
  ]);

  return payment;
}

/**
 * Run the full fulfillment pipeline. Idempotent — safe to call multiple times.
 * Returns { invoiceNumber, accessUrl, entities }.
 */
export async function fulfillOrder(
  orderId: string,
  opts: { adminId?: string; notify?: boolean } = {},
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  // Already fulfilled?
  const alreadyInvoice = await prisma.invoice.findUnique({ where: { orderId } });
  const alreadyEntitlement = await prisma.entitlement.findFirst({ where: { orderId } });
  if (alreadyInvoice && alreadyEntitlement && order.accessGranted) {
    return { invoiceNumber: alreadyInvoice.number, accessUrl: await buildAccessUrlForOrder({ orderNumber: order.orderNumber, email: order.email }), already: true };
  }

  const customer = await ensureCustomer(order.email, order.name, order.country ?? undefined);
  await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id } });

  const invoice = await issueInvoice(order.id, opts.adminId);
  const entitlement = await createEntitlement(order.id, opts.adminId);
  await recordConfirmedPayment(order.id, order.method, { method: order.method });
  const accessUrl = await buildAccessUrlForOrder({ orderNumber: order.orderNumber, email: order.email });

  // Send the transactional emails (template-driven).
  await sendPurchaseEmailsForOrder(order.id);

  // Analytics + notification.
  try {
    trackEvent("purchase_completed", { orderNumber: order.orderNumber, method: order.method });
  } catch {
    /* ignore */
  }
  if (opts.notify !== false) {
    await createNotification({
      type: "order",
      title: `New paid order ${order.orderNumber}`,
      body: `${order.name} — ${order.currency} ${(order.amountMinor / 100).toFixed(2)} via ${order.method}`,
      link: `/admin/orders/${order.id}`,
    });
  }

  await logAudit({
    userId: opts.adminId,
    action: "ORDER_FULFILLED",
    resource: "order",
    resourceId: order.id,
    description: `Order ${order.orderNumber} fulfilled (invoice ${invoice.number}, entitlement ${entitlement.id})`,
  });

  return { invoiceNumber: invoice.number, accessUrl, already: false };
}

// ---------------------------------------------------------------------------
// Template-driven email sending (wraps src/lib/email, resolves templates).
// ---------------------------------------------------------------------------
async function renderTemplate(key: string, vars: Record<string, string>) {
  const tpl = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!tpl || !tpl.isActive) return null;
  let out = tpl.body;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  // Also resolve subject variables.
  let subject = tpl.subject;
  for (const [k, v] of Object.entries(vars)) subject = subject.split(`{{${k}}}`).join(v);
  return { subject, body: out, html: tpl.html };
}

async function sendPurchaseEmailsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const invoice = await prisma.invoice.findUnique({ where: { orderId } });
  const amount = `${order.currency} ${(order.amountMinor / 100).toFixed(2)}`;
  const accessUrl = await buildAccessUrlForOrder({ orderNumber: order.orderNumber, email: order.email });
  const vars: Record<string, string> = {
    customer_name: order.name,
    customer_email: order.email,
    order_id: order.orderNumber,
    product_name: order.productName,
    amount,
    currency: order.currency,
    invoice_number: invoice?.number ?? "",
    download_link: accessUrl,
    support_email: config.email.support,
  };

  const flows = [
    { template: "purchase_confirmation", fallbackSubject: `Your ${order.productName} order — confirmed` },
    { template: "invoice", fallbackSubject: `Your ${order.productName} invoice` },
    { template: "ebook_access", fallbackSubject: `Your ${order.productName} digital access` },
  ];

  for (const flow of flows) {
    const tpl = await renderTemplate(flow.template, vars);
    let subject = flow.fallbackSubject;
    let body = "";
    if (tpl) {
      subject = tpl.subject;
      body = tpl.body;
      await sendEmail({
        to: order.email,
        subject,
        text: tpl.html ? stripHtml(tpl.body) : tpl.body,
        html: tpl.html ? tpl.body : undefined,
      });
    } else {
      // Fallback default if template missing/disabled — still send (transactional).
      const generated = await emailFallback(flow.template, vars, subject, order.email);
      await sendEmail(generated);
    }
    await prisma.emailLog.create({
      data: { to: order.email, template: flow.template, subject, provider: config.email.transport, status: "sent", orderId, customerId: order.customerId },
    });
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function emailFallback(template: string, vars: Record<string, string>, subject: string, to: string) {
  const body = `Hello ${vars.customer_name},\n\n${template === "ebook_access" ? `Your ${vars.product_name} digital copy is ready: ${vars.download_link}` : template === "invoice" ? `Your invoice ${vars.invoice_number} for ${vars.amount}.` : `Thank you for your purchase of ${vars.product_name}.`}\n\nOrder: ${vars.order_id}\nAmount: ${vars.amount}\nSupport: ${vars.support_email}\n`;
  return { to, subject, text: body } as { to: string; subject: string; text: string; html?: string };
}
