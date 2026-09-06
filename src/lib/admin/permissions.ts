/**
 * RBAC permission catalogue (the source of truth for what admins can do).
 *
 * Each permission has a stable `key`, a `category` (used to group them in the
 * admin UI), and a human `label`. Roles reference these via RolePermission rows.
 *
 * The `super_admin` role is all-powerful (enforced in the auth helper) so it is
 * not listed here — it bypasses permission checks entirely.
 */

export interface PermissionDef {
  key: string;
  category: string;
  label: string;
}

export const ALL_PERMISSIONS: PermissionDef[] = [
  // Dashboard & analytics
  { key: "dashboard:view", category: "dashboard", label: "View dashboard" },
  { key: "analytics:view", category: "analytics", label: "View analytics & visitors" },
  { key: "analytics:export", category: "analytics", label: "Export analytics data" },

  // Catalog / products
  { key: "products:view", category: "catalog", label: "View products" },
  { key: "products:manage", category: "catalog", label: "Manage products & pricing" },
  { key: "ebook:manage", category: "catalog", label: "Manage eBook versions & uploads" },
  { key: "media:manage", category: "catalog", label: "Manage media library" },

  // CMS
  { key: "cms:view", category: "cms", label: "View website content" },
  { key: "cms:manage", category: "cms", label: "Edit & publish website content" },
  { key: "faqs:manage", category: "cms", label: "Manage FAQs" },
  { key: "testimonials:manage", category: "cms", label: "Manage testimonials" },
  { key: "legal:manage", category: "cms", label: "Manage legal pages" },
  { key: "seo:manage", category: "cms", label: "Manage SEO settings" },

  // Commerce
  { key: "orders:view", category: "commerce", label: "View orders" },
  { key: "orders:manage", category: "commerce", label: "Manage orders" },
  { key: "customers:view", category: "commerce", label: "View customers" },
  { key: "customers:manage", category: "commerce", label: "Manage customers & access" },
  { key: "coupons:manage", category: "commerce", label: "Manage coupons" },
  { key: "invoices:view", category: "commerce", label: "View invoices" },
  { key: "invoices:manage", category: "commerce", label: "Manage & email invoices" },

  // Payments
  { key: "payments:view", category: "payments", label: "View payments" },
  { key: "payments:manage", category: "payments", label: "Manage payment providers" },
  { key: "payments:refund", category: "payments", label: "Process refunds" },
  { key: "payments:reconcile", category: "payments", label: "Run payment reconciliation" },
  { key: "webhooks:view", category: "payments", label: "View webhooks" },

  // Email
  { key: "email:view", category: "email", label: "View email templates & logs" },
  { key: "email:manage", category: "email", label: "Manage email & templates" },

  // Security & admin
  { key: "admin:view", category: "security", label: "View admin users & roles" },
  { key: "admin:manage", category: "security", label: "Manage admins, roles & permissions" },
  { key: "security:manage", category: "security", label: "Manage security settings & MFA policy" },
  { key: "audit:view", category: "security", label: "View audit logs" },

  // System
  { key: "system:view", category: "system", label: "View system health & logs" },
  { key: "system:manage", category: "system", label: "Manage system settings & backups" },
  { key: "settings:view", category: "system", label: "View settings" },
  { key: "settings:manage", category: "system", label: "Manage settings" },
];

/** Roles and the permissions assigned to each (super_admin bypasses all). */
export const ROLE_DEFINITIONS: {
  key: string;
  name: string;
  description: string;
  permissionKeys: string[];
}[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full, unrestricted access to everything.",
    permissionKeys: [], // bypasses all checks
  },
  {
    key: "admin",
    name: "Administrator",
    description: "General administration across the business.",
    permissionKeys: [
      "dashboard:view",
      "analytics:view",
      "products:view", "products:manage", "ebook:manage", "media:manage",
      "cms:view", "cms:manage", "faqs:manage", "testimonials:manage", "legal:manage", "seo:manage",
      "orders:view", "orders:manage", "customers:view", "customers:manage", "coupons:manage",
      "invoices:view", "invoices:manage",
      "payments:view", "payments:manage", "payments:refund", "payments:reconcile", "webhooks:view",
      "email:view", "email:manage",
      "admin:view", "audit:view",
      "system:view", "settings:view", "settings:manage",
    ],
  },
  {
    key: "finance",
    name: "Finance Manager",
    description: "Orders, payments, invoices, and refunds.",
    permissionKeys: [
      "dashboard:view",
      "orders:view", "orders:manage", "invoices:view", "invoices:manage",
      "payments:view", "payments:manage", "payments:refund", "payments:reconcile", "webhooks:view",
      "customers:view",
      "settings:view",
    ],
  },
  {
    key: "content",
    name: "Content Manager",
    description: "CMS, eBook, media, FAQs, testimonials, legal, and SEO.",
    permissionKeys: [
      "cms:view", "cms:manage", "faqs:manage", "testimonials:manage",
      "legal:manage", "seo:manage", "products:view", "products:manage",
      "ebook:manage", "media:manage",
      "analytics:view", "dashboard:view",
    ],
  },
  {
    key: "support",
    name: "Support Manager",
    description: "Customers, orders, and access management.",
    permissionKeys: [
      "customers:view", "customers:manage", "orders:view", "orders:manage",
      "ebook:manage", "invoices:view", "email:view",
      "dashboard:view",
    ],
  },
  {
    key: "analyst",
    name: "Analyst",
    description: "Analytics, reports, and read-only insight.",
    permissionKeys: [
      "dashboard:view", "analytics:view", "analytics:export",
      "orders:view", "customers:view", "payments:view", "invoices:view",
    ],
  },
];
