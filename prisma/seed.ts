/**
 * Development seed — populates roles/permissions, a default super admin, the
 * product, CMS site sections, FAQs, testimonials, legal pages, email templates,
 * payment providers, and default settings from the app's bundled content.
 *
 * Clearly-labelled DEMO data only; it never fabricates analytics or sales.
 * Run: `npm run db:seed`
 *
 * The super-admin credentials printed here are ONLY for local development and
 * MUST be changed in production.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_DEFINITIONS, ALL_PERMISSIONS } from "../src/lib/admin/permissions";
import { SETTING_DEFS } from "../src/lib/admin/settings";

const prisma = new PrismaClient();

async function seedPermissions() {
  for (const p of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label, category: p.category },
      create: { key: p.key, label: p.label, category: p.category },
    });
  }
  console.log("Seeded permissions:", ALL_PERMISSIONS.length);
}

async function seedRoles() {
  for (const r of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, description: r.description, isSuperRole: r.key === "super_admin", isSystem: true },
      create: {
        key: r.key,
        name: r.name,
        description: r.description,
        isSuperRole: r.key === "super_admin",
        isSystem: true,
      },
    });
    const perms = await prisma.permission.findMany({ where: { key: { in: r.permissionKeys } } });
    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log("Seeded roles:", ROLE_DEFINITIONS.length);
}

async function seedSuperAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@rebuild.local";
  const password = process.env.ADMIN_PASSWORD ?? "AdminPass!2026";
  const superRole = await prisma.role.findUnique({ where: { key: "super_admin" } });
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log("Super admin already exists:", email);
    return;
  }
  await prisma.adminUser.create({
    data: {
      email,
      name: "Super Admin",
      passwordHash: await bcrypt.hash(password, 12),
      roleId: superRole?.id,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`Created super admin: ${email} / ${password}  (change in production!)`);
}

async function seedProduct() {
  const prod = await prisma.product.findUnique({ where: { slug: "rebuild-recovery" } });
  if (prod) return;
  await prisma.product.create({
    data: {
      slug: "rebuild-recovery",
      name: "Rebuild — Breakup & Divorce Recovery eBook",
      description: "A practical step-by-step recovery system designed to help you process the pain, rebuild your identity, regain your confidence, and create a stronger version of yourself after a breakup, separation, or divorce.",
      shortDescription: "A structured self-guided recovery eBook.",
      priceMinor: 4900,
      currency: "USD",
      isActive: true,
      features: {
        create: [
          { title: "The complete digital eBook", text: "A thought-through guide you can read on any device.", sortOrder: 0 },
          { title: "Structured recovery framework", text: "Eight clear phases, from stabilising to moving forward.", sortOrder: 1 },
          { title: "Step-by-step exercises", text: "Practical, doable actions for each stage.", sortOrder: 2 },
          { title: "Reflection prompts", text: "Questions that help you understand your own experience.", sortOrder: 3 },
          { title: "Journaling exercises", text: "Guided space to process emotions on the page.", sortOrder: 4 },
        ],
      },
    },
  });
  console.log("Seeded product");
}

async function seedSections() {
  const sections = [
    { key: "hero", label: "Hero", sortOrder: 0 },
    { key: "problem", label: "Emotional Problem", sortOrder: 1 },
    { key: "transformation", label: "Transformation", sortOrder: 2 },
    { key: "features", label: "What You Get", sortOrder: 3 },
    { key: "phases", label: "8-Phase Journey", sortOrder: 4 },
    { key: "how", label: "How It Works", sortOrder: 5 },
    { key: "who", label: "Who It's For", sortOrder: 6 },
    { key: "preview", label: "Product Preview", sortOrder: 7 },
    { key: "pricing", label: "Pricing", sortOrder: 8 },
    { key: "trust", label: "Trust", sortOrder: 9 },
    { key: "final", label: "Final CTA", sortOrder: 10 },
  ];
  for (const s of sections) {
    await prisma.websiteSection.upsert({
      where: { key: s.key },
      update: { label: s.label, sortOrder: s.sortOrder, isEnabled: true, published: true },
      create: { key: s.key, label: s.label, sortOrder: s.sortOrder, isEnabled: true, published: true, content: "{}", history: "[]" },
    });
  }
  console.log("Seeded website sections:", sections.length);
}

async function seedFaqs() {
  const count = await prisma.faqItem.count();
  if (count > 0) return;
  const faqs = [
    { question: "Is this a physical book?", answer: "No — it is a digital product. You'll receive secure digital access, readable on the device you already own.", sortOrder: 0 },
    { question: "How will I receive it?", answer: "After a successful payment, you'll be taken to a private access page with download instructions. A confirmation email and a getting-started email are also sent.", sortOrder: 1 },
    { question: "Can I read it on my phone?", answer: "Yes. The eBook is delivered in a mobile-friendly format, so you can read it on your phone, tablet, or computer.", sortOrder: 2 },
    { question: "Is this only for people who were dumped?", answer: "No. It can be useful for anyone experiencing a breakup, separation, divorce, or other significant relationship loss.", sortOrder: 3 },
    { question: "How quickly will I recover?", answer: "There is no single recovery timeline. Everyone's experience differs, and the material is designed to be worked through at your own pace.", sortOrder: 4 },
    { question: "Can this replace therapy?", answer: "No. This is a self-guided educational and personal-development resource, not a replacement for professional mental-health care.", sortOrder: 5 },
    { question: "What payment methods are available?", answer: "Razorpay (cards/UPI), PayPal, and Wise — subject to the payment setup enabled at checkout.", sortOrder: 6 },
    { question: "Do you offer refunds?", answer: "Please see the Refund Policy page for the exact terms, including any qualifying period and how to request one.", sortOrder: 7 },
  ];
  for (const f of faqs) {
    await prisma.faqItem.create({ data: { ...f, isPublished: true } });
  }
  console.log("Seeded FAQs:", faqs.length);
}

async function seedPaymentProviders() {
  const providers = [
    { key: "razorpay", name: "Razorpay", enabled: true, environment: "sandbox", showOnCheckout: true },
    { key: "paypal", name: "PayPal", enabled: true, environment: "sandbox", showOnCheckout: true },
    { key: "wise", name: "Wise", enabled: true, environment: "sandbox", showOnCheckout: true },
  ];
  for (const p of providers) {
    await prisma.paymentProvider.upsert({
      where: { key: p.key },
      update: { name: p.name, enabled: p.enabled, environment: p.environment, showOnCheckout: p.showOnCheckout },
      create: { ...p, testKey: "", testSecret: "", liveKey: "", liveSecret: "" },
    });
  }
  console.log("Seeded payment providers");
}

async function seedEmailTemplates() {
  const templates = [
    { key: "purchase_confirmation", name: "Purchase Confirmation", subject: "Your {{product_name}} order — confirmed", body: "Hello {{customer_name}},\n\nThank you for your purchase of {{product_name}}. Your order {{order_id}} has been confirmed for {{amount}}.\n\nWe're glad you're here.", html: false, isActive: true },
    { key: "invoice", name: "Invoice", subject: "Your {{product_name}} invoice {{invoice_number}}", body: "Hello {{customer_name}},\n\nYour invoice {{invoice_number}} for {{amount}} is attached / available below.\n\nOrder: {{order_id}}", html: false, isActive: true },
    { key: "ebook_access", name: "eBook Access", subject: "Your {{product_name}} digital access", body: "Hello {{customer_name}},\n\nYour digital copy of {{product_name}} is ready. Access it here: {{download_link}}\n\nOrder: {{order_id}}", html: false, isActive: true },
    { key: "ebook_replacement", name: "eBook Replacement", subject: "Updated version available", body: "Hello {{customer_name}},\n\nA new version of {{product_name}} is available for you: {{download_link}}", html: false, isActive: true },
    { key: "refund", name: "Refund", subject: "Your refund for {{product_name}}", body: "Hello {{customer_name}},\n\nYour refund for {{amount}} has been processed.\n\nOrder: {{order_id}}", html: false, isActive: true },
    { key: "payment_failure", name: "Payment Failure", subject: "Payment not completed", body: "Hello {{customer_name}},\n\nWe couldn't complete your payment for {{product_name}}. Please try again or contact support.", html: false, isActive: true },
    { key: "payment_pending", name: "Payment Pending", subject: "Payment pending", body: "Hello {{customer_name}},\n\nYour payment for {{product_name}} is pending verification. We'll notify you once it's confirmed.", html: false, isActive: true },
    { key: "welcome", name: "Welcome", subject: "Welcome to {{product_name}}", body: "Hello {{customer_name}},\n\nWelcome. Take it one step at a time.", html: false, isActive: true },
    { key: "password_reset", name: "Password Reset", subject: "Reset your password", body: "Hello {{customer_name}},\n\nUse this link to reset your password: {{download_link}}", html: false, isActive: true },
    { key: "security_alert", name: "Security Alert", subject: "Security alert", body: "Hello {{customer_name}},\n\nWe noticed unusual activity on your account.", html: false, isActive: true },
  ];
  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: t.key },
      update: { name: t.name, subject: t.subject, body: t.body, html: t.html, isActive: t.isActive },
      create: { ...t },
    });
  }
  console.log("Seeded email templates:", templates.length);
}

async function seedLegalPages() {
  const legal = [
    { slug: "privacy-policy", title: "Privacy Policy", updated: "Last updated: 6 September 2026", status: "published" },
    { slug: "terms", title: "Terms & Conditions", updated: "Last updated: 6 September 2026", status: "published" },
    { slug: "refund-policy", title: "Refund Policy", updated: "Last updated: 6 September 2026", status: "published" },
    { slug: "disclaimer", title: "Disclaimer", updated: "Last updated: 6 September 2026", status: "published" },
    { slug: "cookie-policy", title: "Cookie Policy", updated: "Last updated: 6 September 2026", status: "draft" },
  ];
  for (const l of legal) {
    await prisma.legalPage.upsert({
      where: { slug: l.slug },
      update: { title: l.title, updated: l.updated, status: l.status },
      create: { ...l, content: "[]", history: "[]" },
    });
  }
  console.log("Seeded legal pages:", legal.length);
}

async function seedSeo() {
  await prisma.seoConfig.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      slug: "home",
      title: "Breakup & Divorce Recovery Guide | Rebuild Yourself & Start Again",
      description: "A practical, self-guided recovery system designed to help you heal after a breakup, separation, or divorce — rebuild your identity, regain confidence, and create a new chapter.",
      robots: "index,follow",
    },
  });
  console.log("Seeded SEO config");
}

async function seedSettings() {
  for (const def of SETTING_DEFS) {
    await prisma.systemSetting.upsert({
      where: { key: def.key },
      update: {},
      create: { key: def.key, value: def.default, type: def.type, group: def.group, label: def.label },
    });
  }
  console.log("Seeded settings:", SETTING_DEFS.length);
}

async function main() {
  console.log("Seeding Rebuild admin/CMS database…");
  await seedPermissions();
  await seedRoles();
  await seedSuperAdmin();
  await seedProduct();
  await seedSections();
  await seedFaqs();
  await seedPaymentProviders();
  await seedEmailTemplates();
  await seedLegalPages();
  await seedSeo();
  await seedSettings();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
