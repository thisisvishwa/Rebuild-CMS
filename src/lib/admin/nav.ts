/**
 * Admin sidebar navigation. Maps the modules in the spec to admin routes.
 * Each entry declares an optional RBAC permission required to see it.
 */
export interface NavItem {
  label: string;
  href: string;
  perm?: string;
  icon?: string; // lucide icon name (resolved client-side)
  section?: string;
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", perm: "dashboard:view", icon: "LayoutDashboard" },
  { label: "Website CMS", href: "/admin/content", perm: "cms:view", icon: "FileText" },
  { label: "Products", href: "/admin/products", perm: "products:view", icon: "Package" },
  { label: "eBook Management", href: "/admin/ebook", perm: "ebook:manage", icon: "BookOpen" },
  { label: "Orders", href: "/admin/orders", perm: "orders:view", icon: "ShoppingCart" },
  { label: "Customers", href: "/admin/customers", perm: "customers:view", icon: "Users" },
  { label: "Visitors", href: "/admin/visitors", perm: "analytics:view", icon: "Activity" },
  { label: "Analytics", href: "/admin/analytics", perm: "analytics:view", icon: "ChartLine" },
  { label: "Traffic Sources", href: "/admin/traffic", perm: "analytics:view", icon: "Share2" },
  { label: "Checkout", href: "/admin/checkout", perm: "orders:view", icon: "CreditCard" },
  { label: "Payments", href: "/admin/payments", perm: "payments:view", icon: "Wallet" },
  { label: "Payment Providers", href: "/admin/payment-providers", perm: "payments:manage", icon: "Server" },
  { label: "Invoices", href: "/admin/invoices", perm: "invoices:view", icon: "Receipt" },
  { label: "Email", href: "/admin/email", perm: "email:view", icon: "Mail" },
  { label: "Downloads", href: "/admin/downloads", perm: "orders:view", icon: "Download" },
  { label: "Coupons", href: "/admin/coupons", perm: "coupons:manage", icon: "Ticket" },
  { label: "FAQs", href: "/admin/faqs", perm: "faqs:manage", icon: "HelpCircle" },
  { label: "Testimonials", href: "/admin/testimonials", perm: "testimonials:manage", icon: "MessageSquareQuote" },
  { label: "Media Library", href: "/admin/media", perm: "media:manage", icon: "Image" },
  { label: "SEO", href: "/admin/seo", perm: "seo:manage", icon: "Search" },
  { label: "Legal Pages", href: "/admin/legal", perm: "legal:manage", icon: "Scale" },
  { label: "Notifications", href: "/admin/notifications", perm: "dashboard:view", icon: "Bell" },
  { label: "Admin Users", href: "/admin/users", perm: "admin:view", icon: "BadgeCheck" },
  { label: "Roles & Permissions", href: "/admin/roles", perm: "admin:manage", icon: "KeyRound" },
  { label: "Security", href: "/admin/security", perm: "security:manage", icon: "ShieldCheck" },
  { label: "API & Webhooks", href: "/admin/api", perm: "system:view", icon: "Webhook" },
  { label: "System Logs", href: "/admin/logs", perm: "system:view", icon: "ScrollText" },
  { label: "Audit Logs", href: "/admin/audit", perm: "audit:view", icon: "History" },
  { label: "System Health", href: "/admin/health", perm: "system:view", icon: "HeartPulse" },
  { label: "Backups", href: "/admin/backups", perm: "system:manage", icon: "DatabaseBackup" },
  { label: "Settings", href: "/admin/settings", perm: "settings:view", icon: "Settings" },
];
