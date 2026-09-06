# Deployment Guide — Rebuild Recovery eBook

This walks you from a local demo to a **live, production-ready site** selling the eBook with real payments, email, and secure delivery.

---

## 0. Read this first

The app ships in **demo mode** (`PAYMENT_MODE="demo"`) by design. In demo mode the whole funnel (checkout → success → access → download → emails) works with **no credentials** so you can test everything. Before going live you must:

1. Set real credentials and `PAYMENT_MODE="live"`.
2. Use a real database (PostgreSQL).
3. Configure email (SMTP).
4. Replace the placeholder eBook with your real file.
5. Set your real business/legal details.
6. Deploy the production build.

---

## 1. Domain & hosting

Choose any Node.js host: **Vercel**, **Render**, **Railway**, **Fly.io**, a **VPS**, or **Docker**. All you need is a Node 20+ runtime and a persistent database. The build command is `next build`; start is `npm start` (binds `0.0.0.0:3000`).

> **Point your domain** at the host and set `APP_URL` to your canonical `https://` URL (no trailing slash). This drives email links, redirects, and SEO metadata.

---

## 2. Database

The default `DATABASE_URL="file:./dev.db"` (SQLite) is for local dev only. For production use **PostgreSQL**:

1. Provision a Postgres database (managed: Neon, Supabase, RDS, Render).
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"        // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` (e.g. `postgresql://user:pass@host:5432/db?schema=public`).
4. Apply the schema:
   ```bash
   npx prisma migrate deploy   # in production use migrations, not db push
   ```
   (First-time setup: run `npx prisma migrate dev` locally to create a migration set, then `migrate deploy` in prod.)

---

## 3. Payments

### Master switch
```env
PAYMENT_MODE="live"
```

### Razorpay (cards / UPI / netbanking)
1. Create a Razorpay account.
2. Get **Key ID** (`Razorpay Key ID`) and **Key Secret** from the Dashboard → Settings → API Keys.
3. Set:
   ```env
   RAZORPAY_KEY_ID="rzp_live_xxxx"
   RAZORPAY_KEY_SECRET="your_secret"
   ```
4. Whitelist your domain in Razorpay Dashboard → Settings (allowed payment methods/donations).

The checkout opens Razorpay's hosted UI; **card data never touches your server**. After payment the server verifies the HMAC signature *and* re-checks the payment status before granting access.

### PayPal
1. Create a PayPal developer app (Dashboard → Apps & Credentials).
2. Set:
   ```env
   PAYPAL_CLIENT_ID="..."
   PAYPAL_CLIENT_SECRET="..."
   PAYPAL_ENV="live"        # or "sandbox" for testing
   ```
The site uses PayPal's Orders → Capture flow with server-side verification.

### Wise
Wise has no universal hosted checkout, so the site uses a **configurable manual flow**:
```env
WISE_PAYMENT_FLOW="manual"
WISE_BENEFICIARY_NAME="Your Business Name"
WISE_ACCOUNT_NUMBER="..."
WISE_BANK_NAME="..."
WISE_IBAN="..."
WISE_SWIFT="..."
WISE_INSTRUCTIONS="Pay to the account shown on the next step, then paste your reference/order ID as proof of payment. Access is granted once payment is verified."
```
The customer sees instructions, submits their reference/proof, and a human verifies before access is granted. **We never claim automatic Wise verification** unless you build a real integration (then set `WISE_PAYMENT_FLOW="automated"` and add it).

---

## 4. Email

```env
EMAIL_TRANSPORT="smtp"
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_SECURE="false"
EMAIL_FROM="Rebuild <support@your-domain.com>"
EMAIL_SUPPORT="support@your-domain.com"
```
Use any SMTP provider (Postmark, Mailgun, Amazon SES, Resend, SendGrid, Gmail app-password). With `EMAIL_TRANSPORT="console"` (dev) emails print to the server log instead.

The app sends three transactional emails on a verified purchase:
1. **Purchase confirmation**
2. **Digital access** (with the secure, expiring link)
3. **Getting started**

No manipulative/emotional marketing emails are sent.

---

## 5. eBook asset & secure delivery

Access is protected by **signed, expiring URLs** — never a permanent public file.

- **Option A — self-hosted (default):** `SECURE_DOWNLOAD="true"`. The `/api/access/download` endpoint currently serves a small **placeholder PDF** so the flow is testable. Replace that with your real eBook file (e.g. put the PDF under a protected area and serve it from the route, or host it privately).
- **Option B — object storage / CDN:** set `EBOOK_DOWNLOAD_URL` to a private signed-object URL. The route redirects to it after verifying the access token.
- Keep `DOWNLOAD_LINK_TTL` modest (default 900s) and **set a strong `ACCESS_TOKEN_SECRET`** (`openssl rand -hex 32`).

---

## 6. Legal & business details

Review and update with your real entity:
- `src/content/legal.ts` — Privacy, Terms, Refund, Disclaimer, Contact (business name, address, contact email, refund period).
- `src/content/faq.ts` — the refund FAQ references the policy page.
- `src/content/site.ts` — brand name, nav, footer.

Refund policy defaults are a **template** — replace before launch.

---

## 7. Analytics (optional)

```env
ANALYTICS_PROVIDER="ga"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXX"
```
With GA enabled the site emits events: `landing_view`, `cta_click`, `pricing_view`, `checkout_opened`, `payment_method_selected`, `checkout_initiated`, `purchase_completed`, `download_accessed`, `error_shown`. Leave `ANALYTICS_PROVIDER="none"` to disable entirely. We never collect sensitive emotional/health data.

---

## 8. Security checklist (production)

- [ ] `PAYMENT_MODE="live"` and real credentials set.
- [ ] `ACCESS_TOKEN_SECRET` changed to a strong random value.
- [ ] `APP_URL` set to your HTTPS canonical URL.
- [ ] PostgreSQL database with a strong password; network restricted.
- [ ] SMTP credentials set; `EMAIL_TRANSPORT="smtp"`.
- [ ] HTTPS enforced at the host (the site sets Strict-Transport-Security via your host / it's HTTPS-ready).
- [ ] Security headers verified (CSP, X-Frame-Options, etc. are in `next.config.mjs`).
- [ ] Legal pages updated with real business info.
- [ ] Real eBook replacing the placeholder.

---

## 9. Verify before launch

```bash
npm run typecheck   # no errors
npm run build       # succeeds
npm run db:migrate  # schema applied
```
Then run a **live payment test with a test card** (Razorpay test mode / PayPal sandbox) and confirm: order recorded → verified → payment success → access page → download works → three emails arrive. Confirm the thank-you page hides for a bad signature and the failed page offers retry.

---

## 10. Going live

- Deploy with `next build` / `npm start`.
- Set all production env vars in your host's dashboard.
- Run `npx prisma migrate deploy` against the production DB.
- Point your domain at the host and set `APP_URL`.

You're live. ✅

---

## 11. Admin / CMS backend — go-live & operations

The admin dashboard is part of the same app (under `/admin`). Deploying the storefront deploys the admin too.

### Pre-production steps (admin)

- [ ] `npx prisma db push` (or `prisma migrate deploy`) applies the schema; `npx prisma db seed` seeds permissions, roles, super-admin, product, sections, FAQs, payment providers, email templates, legal pages, SEO, and settings.
- [ ] **Change the seeded super-admin password** (`admin@rebuild.local` / `AdminPass!2026`) on the **Admin Users** page — or delete/replace that account before going live.
- [ ] Enable **MFA** for every admin (Security page) and set the org policy "Require MFA for all admins".
- [ ] Set `ADMIN_CREDENTIALS_KEY` to a long random value (>= 16 chars) — it encrypts admin-stored credentials (payment/SMTP secrets) at rest. A dev-safe fallback is derived from `ACCESS_TOKEN_SECRET`, but in production set it explicitly.
- [ ] Configure each **Payment Provider** (enable/disable, sandbox vs live, test & live keys). Secrets are stored **encrypted**.
- [ ] Review **Email templates** and set SMTP (or leave `EMAIL_TRANSPORT="console"` for local testing).
- [ ] Add a real eBook version (PDF/EPUB) on **eBook Management** — until one is uploaded the storefront shows access/delivery as not configured.
- [ ] Review legal pages with counsel and publish real business/contact details, then publish them.

### RBAC

Roles (Super Admin, Administrator, Finance, Content, Support, Analyst) map to 34 permissions and are edited live on **Roles & Permissions**. Super Admin bypasses all checks; system roles can be edited but not deleted, and the Super Admin role is locked.

### Scheduling / jobs & backups

- System health, audit logs, system logs, and backups are all available under the relevant admin modules.
- For production databases (Postgres/MySQL) prefer the provider's native point-in-time backups; the **Backups** module covers SQLite/self-managed and produces a shareable snapshot.

### Regular operations sanity check

```bash
npm run typecheck   # clean
npm run lint        # clean (no warnings/errors)
npm run build       # succeeds
npm run start       # run the built app
```

Login at `/admin`, then work through the dashboard: `Orders → Payments → Invoices → Customers → Email → Analytics → System Health`. Every write through these modules also lands in the Audit Log.
