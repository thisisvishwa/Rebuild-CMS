# Rebuild — Breakup & Divorce Recovery eBook

A production-grade, conversion-focused **landing page + secure checkout + digital-delivery system** for a premium digital eBook about recovering and rebuilding after a breakup, separation, or divorce.

Built to the full specification in
[`REFERENCE.md`](./REFERENCE.md) — a retained copy of the original
"Breakup & Divorce Recovery eBook — Landing Page Creation Prompt".

---

## Why this build is trustworthy

- **No fabricated testimonials, statistics, or fake urgency.** The testimonial section is a clearly-labelled honest placeholder until real, permission-provided reviews are added.
- **No unsupported medical/therapeutic claims.** Pricing, phases, and outcomes are framed as *possible directions* the material supports — never guarantees.
- **Ethical checkout.** Payment is simulated in DEV demo mode and only verifies against real processors when credentials are provided and `PAYMENT_MODE="live"`.
- **No exposed secrets.** All credentials live in environment variables, never in client code.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) + React 18 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + custom brand palette |
| Database | Prisma 5 (SQLite by default, PostgreSQL-ready) |
| Payments | Razorpay · PayPal · Wise (all server-side verified) |
| Email | Nodemailer (console transport for dev, SMTP for prod) |
| Secure delivery | Signed, expiring JWT access tokens |
| Security | CSP, security headers, rate limiting, Zod validation, signed download links |
| SEO/A11y | Open Graph + Twitter meta, JSON-LD structured data, sitemap, robots, WCAG-oriented practices |

---

## Features implemented (checklist vs. the brief)

**Landing page** — premium editorial aesthetic (cream / warm neutral / muted earth tones, serif display + sans body), and these sections in order:

- ✅ Hero (headline, subhead, dual CTAs, trust line, premium device/book mockups)
- ✅ Emotional problem ("you're not broken")
- ✅ Before / After transformation
- ✅ What you get (feature grid)
- ✅ 8-phase "What's inside" journey timeline (Stabilize → Move Forward)
- ✅ How it works (3 steps)
- ✅ Who this is for / not for
- ✅ Product preview / mockup
- ✅ Pricing card (single source of truth price, config-driven)
- ✅ Testimonials (honest placeholder)
- ✅ Trust section (secure payment, delivery, policies, support)
- ✅ FAQ accordion
- ✅ Final CTA
- ✅ Wellness disclaimer banner
- ✅ Footer (links, payment badges, copyright)
- ✅ Sticky mobile CTA (`Get the eBook — $49`) that hides near the footer

**Checkout & delivery:**
- ✅ Checkout page (name, email, country, payment method, order summary, total)
- ✅ Razorpay hosted checkout (cards/UPI) with server-side signature + status verification
- ✅ PayPal order/capture flow with server-side verification
- ✅ Wise configurable manual flow with reference/proof-of-payment + admin verification
- ✅ Payment success page
- ✅ Payment failed page (friendly retry/support)
- ✅ Secure access page (per-order, expiring)
- ✅ Secure download endpoint (signed/expiring) — never a permanent public URL
- ✅ Transactional email sequence (confirmation, digital access, getting started)

**Required pages:** Landing, Checkout, Payment Success, Payment Failed, Download/Access, Privacy Policy, Terms & Conditions, Refund Policy, Disclaimer, Contact/Support, 404.

**Production concerns:** SEO meta/OpenGraph/JSON-LD, responsive across 320–1920px, lazy reveal animations honoring `prefers-reduced-motion`, accessibility (focus states, semantic HTML, keyboard nav), rate limiting, input validation, CSRF-free stateless design, security headers, analytics event hooks (config-driven, off by default).

---

## Getting started (local development incl. Windows)

### Prerequisites
- **Node.js 18.17+** (recommend the LTS 20.x). Install from [nodejs.org](https://nodejs.org) — the Windows installer works fine.
- **npm** (bundled with Node).
- No database install needed — the default is a zero-config SQLite file.

### 1. Install
```bash
cd recovery-ebook
npm install
```
This runs a `postinstall` hook that generates the Prisma client.

### 2. Configure environment
The repo ships safe **demo-mode** `.env.local` (no credentials needed) and an `.env` for Prisma.

```bash
# .env.local (demo mode) — already present. Copy .env.example if you reset it:
cp .env.example .env.local
```
`.env.local` uses `PAYMENT_MODE="demo"` so **you can test the entire purchase → success → access → download flow with no live payment credentials.**

### 3. Set up the database
```bash
# Create the SQLite database + tables (uses .env DATABASE_URL)
npx prisma db push

# Optional: seed a sample order for inspection
npm run db:seed
```

### 4. Run it
```bash
npm run dev
```
Open http://localhost:3000. (The dev server binds `0.0.0.0:3000` so it also works in Docker/WSL and the hosted preview.)

> **Windows note:** all commands above are cross-platform. If you get a native module issue, ensure you're on Node 20 LTS and re-run `npm install`. SQLite writes `prisma/dev.db` (gitignored).

### 5. Test the full demo purchase
1. Visit `/`.
2. Click **Get the eBook** → `/checkout`.
3. Fill in name/email (use a real email to see the email flow in the server log), pick a method.
4. Click **Continue to payment**. In demo mode this will:
   - Razorpay/PayPal/Wise → **simulated** completion (no real charge).
5. Land on `/payment/success`, then **Access your eBook** → `/access`.
6. Click **Download your eBook** → gets a valid PDF.
7. Check the terminal log — you'll see the three transactional emails printed (console transport).

### Verification commands
```bash
npm run typecheck        # TypeScript strict check
npm run lint             # ESLint (Next)
npm run build            # Production build
npm run start            # Serve the production build on 0.0.0.0:3000
```

---

## Configuration reference

Everything is centralized in [`src/lib/config.ts`](./src/lib/config.ts) and pulled from environment variables (`.env.local` / `"env"`). **No secrets are hard-coded.**

| Env var | Purpose |
| --- | --- |
| `APP_URL` | Canonical site URL (used for emails, redirects, metadata). |
| `PRODUCT_NAME` | Product/brand name. |
| `PRODUCT_PRICE_AMOUNT` | Price in **smallest currency unit** (4900 = $49.00). |
| `PRODUCT_PRICE_CURRENCY` | ISO currency code. |
| `NEXT_PUBLIC_PRICE_DISPLAY` | Display string shown on the page. |
| `PAYMENT_MODE` | `demo` (simulate) or `live` (real processors). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay credentials. |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_ENV` | PayPal credentials + `sandbox`/`live`. |
| `WISE_PAYMENT_FLOW` + `WISE_*` | Wise manual-flow beneficiary details + instructions. |
| `DATABASE_URL` | Prisma connection string. |
| `EMAIL_TRANSPORT` | `console` (log to output) or `smtp`. |
| `SMTP_*`, `EMAIL_FROM`, `EMAIL_SUPPORT` | Transactional email config. |
| `EBOOK_DOWNLOAD_URL` | Optional CDN/object-store URL for the real eBook. |
| `SECURE_DOWNLOAD` | `true` = signed/expiring links; `false` uses the URL above. |
| `DOWNLOAD_LINK_TTL` | Access-link lifetime in seconds (default 900). |
| `ACCESS_TOKEN_SECRET` | HMAC secret for signed access links (change in prod). |
| `ANALYTICS_PROVIDER` / `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Analytics (off by default). |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Rate limiting for API routes. |

---

## Putting it into production

Follow [`DEPLOYMENT.md`](./DEPLOYMENT.md) for a step-by-step guide (domain, database, payment credentials, email, hosting, and going live). Highlights:

1. **Set real credentials** — copy `.env.production.example` and fill it, **set `PAYMENT_MODE="live"`**.
2. **Switch the database to PostgreSQL** (change `provider` in `prisma/schema.prisma` and `DATABASE_URL`).
3. **Set `EMAIL_TRANSPORT="smtp"`** and real SMTP creds.
4. **Replace the placeholder eBook** via `EBOOK_DOWNLOAD_URL` or by updating the asset served by `/api/access/download`.
5. **Review the legal pages** (`src/content/legal.ts`) with counsel and update business details.
6. **Deploy** — any Node host (Vercel, Render, Railway, Fly.io, a VPS, or Docker). Build with `next build`.

---

## Project structure

```
recovery-ebook/
├── prisma/
│   ├── schema.prisma          # Order, PaymentEvent, ContactMessage
│   └── seed.ts                # optional sample order
├── public/
│   ├── og-image.png           # Open Graph image
│   └── (protected/ for real assets)
├── src/
│   ├── app/                   # App Router pages + API routes
│   │   ├── page.tsx           # Landing page
│   │   ├── checkout/          # Checkout
│   │   ├── access/            # Secure access page
│   │   ├── payment/{success,failed}/
│   │   ├── contact/
│   │   ├── api/               # checkout, payments/*, access, contact
│   │   └── privacy-policy, terms, refund-policy, disclaimer
│   ├── components/            # UI (Header, Footer, sections, checkout, contact)
│   ├── content/               # ALL editable copy (landing, faq, testimonials, legal, site)
│   ├── lib/                   # config, prisma, validation, email, orders, payments, access, analytics
│   └── types/
├── .env.example              # Full documented env template
├── .env.production.example   # Production env template
├── next.config.mjs           # Security headers + config
└── tailwind.config.ts        # Brand palette + typography
```

---

## Editing content

| What | Where |
| --- | --- |
| Landing page copy (every section) | `src/content/landing.ts` |
| FAQ questions | `src/content/faq.ts` |
| Testimonials | `src/content/testimonials.ts` |
| Legal / support pages | `src/content/legal.ts` |
| Site name / nav / footer links | `src/content/site.ts` |
| Price / product / credentials | `.env.local` → `src/lib/config.ts` |

**Price is a single source of truth** — change `PRODUCT_PRICE_AMOUNT` (and `NEXT_PUBLIC_PRICE_DISPLAY`) once; it propagates to the pricing card, checkout, emails, and order records automatically.

**Add a real testimonial** by pushing an object into `src/content/testimonials.ts`:

```ts
export const testimonials = [
  { name: "Aisha", age: 34, situation: "After a divorce", quote: "…" },
];
```

---

## Health & safety

`src/content/landing.ts` exposes a `disclaimerText` used in the on-page banner, footer, and `/_disclaimer`. The content is educational, self-guided, and explicitly states it **is not** a substitute for professional mental-health care, urging anyone in distress to seek qualified or emergency help. This same message is reflected consistently.

---

## License

All original copy, design, and code here are provided for the owner to use commercially. The payment/email integrations require their own valid credentials and abide by their respective terms.

---

## Administration Backend (CMS · Admin Dashboard · E-commerce Engine)

The project now ships a full **enterprise backend** so the business owner can run the whole operation from a browser **without touching source code** — the storefront is driven by the same data it manages. The existing landing page, checkout, and visual design are preserved; the admin is the control center.

### Running it locally (Windows)

```bash
npm install
npm run db:push        # create/update the SQLite schema
npm run db:seed        # seed permissions, roles, super-admin, product, content, providers, templates
npm run dev            # storefront on http://localhost:3000
```

The admin dashboard lives on the **same app** under **`/admin`**, so open **`http://localhost:3000/admin`**.

**Default super-admin (change in production):**
- Email: `admin@rebuild.local`
- Password: `AdminPass!2026`

> The seeded password is a dev-only bootstrap. Change it (and enable MFA) on the **Security** page before any real use.

### Admin modules (31)

Dashboard · Website CMS · Products · eBook Management · Orders · Customers · Visitors · Analytics · Traffic Sources · Checkout · Payments · Payment Providers · Invoices · Email · Downloads · Coupons · FAQs · Testimonials · Media Library · SEO · Legal Pages · Notifications · Admin Users · Roles & Permissions · Security · API & Webhooks · System Logs · Audit Logs · System Health · Backups · Settings

### What the admin controls

- **Content (CMS):** every landing-page section, FAQs, testimonials, legal pages, SEO metadata — edited and published from the dashboard; the storefront reads them via `/api/storefront` and falls back to bundled copy.
- **Catalog & pricing:** single active product, its price/currency/tax (single source of truth), features, and eBook versions (upload, archive, activate). Price is validated **server-side** — the front end never sets it.
- **Commerce:** orders (list, detail, manual order, fulfill, resend access, notes, grant/revoke access), customers (notes, access, entitlements), coupons, invoices, downloads, payments (list, refund), payment providers (Razorpay/PayPal/Wise enable/disable + test/live credentials, encrypted at rest).
- **Deliverability:** transactional email templates (editable) + delivery logs; encrypted SMTP/API credentials.
- **Analytics (real, not fake):** visitor/session tracking, device/country/source attribution, conversion funnel, abandoned checkouts. Unconfigured services show **"Not Configured"**.
- **Security & operations:** Role-Based Access Control (6 roles, 34 permissions), MFA (TOTP + recovery codes), admin session management, immutable audit log, API keys, system logs, system health, database backups, system-wide settings.
- **Authoritative backend:** the backend computes price/discount/tax/total, verifies payments, and grants entitles — the storefront never trusts frontend price/payment/entitlement. Refunds are recorded as adjustment lines (no free CRUD on financial records); every sensitive action is audited.

### Storing secrets

Admin-managed credentials (payment keys/secrets, SMTP) are **encrypted at rest** (AES-256-GCM) and never exposed to the client. Set `ADMIN_CREDENTIALS_KEY` to a long random value in production (a safe dev fallback is derived from `ACCESS_TOKEN_SECRET`).

### Quality gates

```bash
npm run typecheck   # npx tsc --noEmit
npm run lint        # next lint
npm run build       # next build
npm run start       # run the production build locally
```

All three (typecheck, lint, build) are clean. See `DEPLOYMENT.md` for production go-live notes.

---

## Deployment & audit

- **`VERCEL_DEPLOYMENT.md`** — step-by-step reference to take the app live on **Vercel**
  (managed PostgreSQL + Vercel Blob), covering the **storefront** (`/`) and the
  **admin dashboard** (`/admin`) for real. Includes config, env vars, domain/`APP_URL`,
  deploy steps, verification, and a "known serverless caveats" section.
- **`AUDIT_REPORT.md`** — the audit: every admin module + API endpoint with
  ✅ completed / 🟡 partial / ⬜ pending, a commerce/CMS/security matrix, and the list of
  production-hardening items still to do.
- **`.env.production.example`** — the production (Vercel) environment-var template.

### Ready to deploy (Vercel)

```bash
npm run db:sync-postgres          # keep schema.postgresql.prisma in sync (edit schema.prisma first)
# with a Postgres DATABASE_URL set:
npm run db:push:pg && npm run db:seed:pg   # create schema + seed super-admin/product/CMS
vercel --prod                       # or push to Git and import in the Vercel dashboard
```

The app reads `prisma/schema.postgresql.prisma` on Vercel (via `vercel.json`), so the
generated client matches the production database. Local development stays on SQLite
(`npm run dev`) and is unaffected.
