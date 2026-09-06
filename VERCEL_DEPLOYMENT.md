# Deploying "Rebuild" to Vercel — live storefront + admin dashboard

This guide takes the app from local (Windows/SQLite) to a live, publicly-reachable
deployment on **Vercel**, with **both** the customer storefront (`/`) and the admin
dashboard (`/admin`) running for real. It is written for Vercel's serverless model and
accounts for the two things that differ from local development:

1. **The database.** Vercel function filesystems are read-only and ephemeral, so a
   SQLite file **cannot** be used. **Use a managed PostgreSQL database.**
2. **File uploads.** Media / eBook files and SQLite backups written to `storage/`
   will not persist on Vercel. **Use Vercel Blob** (or another object store).

Everything else (Next.js build, the admin dashboard, the CMS, analytics, email, and the
whole purchase → access → download flow) works as-is.

---

## 0. What you need

- A [Vercel](https://vercel.com) account (the free Hobby plan is fine for testing).
- Git repo access for the project (Vercel deploys from a Git provider or the CLI).
- A **PostgreSQL** database. Recommended options:
  - **Neon** (serverless Postgres, generous free tier) — `https://neon.tech`
  - **Supabase** (Postgres + auth/storage) — `https://supabase.com`
  - **Vercel Postgres** (via Neon under the hood) — add from the Vercel dashboard.
- **(Optional but recommended) Vercel Blob** for durable file storage:
  - `https://vercel.com/docs/vercel-blob` — create a store and copy its
    `BLOB_READ_WRITE_TOKEN`.

---

## 1. Provision the database (PostgreSQL)

Create a Postgres database and copy its connection string (pooled/session URL is fine).
It will look like:

```
postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

> Keep the app's **schema portable** between SQLite (local) and Postgres (Vercel).
> The project ships two schemas that are byte-identical except the `provider` line:
> - `prisma/schema.prisma` → `provider = "sqlite"` (used for local dev)
> - `prisma/schema.postgresql.prisma` → `provider = "postgresql"` (used for Vercel)
>
> Run `npm run db:sync-postgres` after editing `schema.prisma` to regenerate the
> Postgres copy so they never drift.

### 1a. Point Prisma at Postgres locally (one-time, to push the schema + seed)

From your machine, set `DATABASE_URL` to the Postgres URL and run:

```bash
# Windows (PowerShell)
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
npm run db:sync-postgres
npm run db:push:pg        # creates tables from the Postgres schema
npm run db:seed:pg        # seeds roles, permissions, super-admin, product, CMS, templates, providers
```

`db:seed:pg` honours `ADMIN_EMAIL` / `ADMIN_PASSWORD` — set them before running so the
first admin isn't the dev bootstrap:

```bash
$env:ADMIN_EMAIL="you@company.com"
$env:ADMIN_PASSWORD="A-STRONG-Unique-Password!"
```

> **Alternative to `db:push`:** for a versioned schema use Prisma migrations:
> `npx prisma migrate deploy --schema prisma/schema.postgresql.prisma`. This project is
> deliberately `db push`-friendly (no hand-written migrations shipped).

---

## 2. Configure Vercel

### 2a. Add the project

In the Vercel dashboard → **Add New → Project**, import the Git repo. Vercel detects
Next.js automatically and reads `vercel.json` for the build command, which:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run db:sync-postgres && prisma generate --schema prisma/schema.postgresql.prisma && next build",
  "installCommand": "npm install"
}
```

> The build regenerates the Prisma client **against the Postgres schema** so the
> generated client matches the production database. (On deploy environments the
> provider-level `DATABASE_URL` must be present; `prisma generate` alone doesn't connect.)

**Runtime note:** Vercel's default Node runtime for Next.js 14 is fine. The heavy admin
routes (seed/backup/email) are within the default function time limits; if any route
times out, add `export const maxDuration = 60` to that specific route file.

### 2b. Set Environment Variables

In the Vercel project → **Settings → Environment Variables**, add the following (scoped
to **Production** and **Preview** as desired).

| Variable | Value / note |
| --- | --- |
| `DATABASE_URL` | Your Postgres connection string (required). |
| `APP_URL` | Your public URL, no trailing slash, e.g. `https://your-app.vercel.app`. Set once the deployment URL exists (see §3). |
| `STORAGE_DRIVER` | `local` (disk) or `vercel` (Blob). Use `vercel` to make uploads durable. |
| `BLOB_READ_WRITE_TOKEN` | Your Vercel Blob token (only if `STORAGE_DRIVER=vercel`). |
| `PAYMENT_MODE` | `demo` to test the whole funnel with no live processors, or `live` when you have real credentials. **Default `demo`.** |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | For live Razorpay (only when `PAYMENT_MODE=live`). |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_ENV` | For live PayPal (`PAYPAL_ENV=sandbox` for testing). |
| `WISE_*` | Wise beneficiary/account details (manual flow has no secret). |
| `EMAIL_TRANSPORT` | `console` (emails log to Vercel function logs) or `smtp`. For real email use `smtp` + `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`. |
| `ACCESS_TOKEN_SECRET` | **Change this.** A long random string that signs download/access tokens. |
| `PRODUCT_NAME` / `PRODUCT_PRICE_AMOUNT` / `PRODUCT_PRICE_CURRENCY` / `NEXT_PUBLIC_PRICE_DISPLAY` | Business identity + price (single source of truth, server-validated). |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Rate limiting (see §5 caveat). |
| `ANALYTICS_PROVIDER` | `none` (default) or `ga`. |

> `NEXT_PUBLIC_*` vars are exposed to the browser and must never hold secrets.

### 2c. Configure Blob (for durable uploads) — optional

If you set `STORAGE_DRIVER=vercel`, create a Blob store and add its
`BLOB_READ_WRITE_TOKEN` as an environment variable. The app stores private media/eBook
files in Blob and streams them back through the signed `/api/media/:name` route, so the
existing authorization contract is unchanged.

Without Blob (`STORAGE_DRIVER=local`), uploads go to the server disk and will **not**
persist between function invocations on Vercel — they are best for quick testing only.

---

## 3. Domain / public URL

- Vercel gives you a URL like `https://<project>.vercel.app`. Once you have it, set
  `APP_URL` to that value (no trailing slash) and **redeploy** so payment redirects and
  access/download links use the real host.
- Go-live: add a custom domain in **Settings → Domains**, then update `APP_URL` again.

`APP_URL` is used everywhere the app builds absolute URLs (PayPal return, access page,
invoices). Leaving it as `http://localhost:3000` will produce broken links in production.

---

## 4. Deploy

1. **Push to Git** (or run `vercel --prod` from the CLI). Vercel builds the app.
2. From the Vercel dashboard → **Deployments**, watch the build. It should
   `sync-postgres`, generate Prisma, and `next build`.
3. After a successful deploy, the storefront is live at `/` and the admin at `/admin`.

### 4a. Verify the storefront (front live)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/       # 200
curl -s https://<project>.vercel.app/api/storefront | head -c 200            # product/price JSON
```

Check that:
- The landing page loads and shows the real product name / price from the DB.
- **Analytics / visitor tracking works**: `POST /api/analytics/track` with a
  `pageview` returns `{"ok":true,"tracked":true}` and shows up in `/admin/{analytics,traffic,visitors}`.

### 4b. Verify the admin dashboard (admin live)

```bash
# Login (replace credentials with the seeded ones)
curl -c cookies.txt -X POST https://<project>.vercel.app/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@company.com","password":"A-STRONG-Unique-Password!"}'

# A sample of the read endpoints (all should return ok:true)
curl -b cookies.txt https://<project>.vercel.app/api/admin/dashboard
curl -b cookies.txt https://<project>.vercel.app/api/admin/orders
curl -b cookies.txt https://<project>.vercel.app/api/admin/payment-providers
```

Then open `/admin` in a browser and confirm all 31 modules render (Orders, Customers,
Products, CMS/Content, FAQs, Testimonials, Media, SEO, Legal, Payments, Payment
Providers, Coupons, Invoices, Email, Downloads, Analytics, Traffic, Visitors,
Checkout, Users, Roles, Security, API & Webhooks, Logs, Audit, Health, Backups,
Settings, Apps/Earnings, plus Dashboard).

### 4c. Run a purchase end-to-end (demo mode)

With `PAYMENT_MODE=demo`:

1. Visit `/` → **Get the eBook** → checkout with a name/email.
2. Complete the **demo** payment step.
3. Confirm `/api/checkout` + `/api/payments/demo/complete` succeed.
4. Confirm the order appears as `paid` + `accessGranted` in `/admin/orders`, an invoice
   was issued, an entitlement was granted, and the access/download link was emailed.
5. Open the access link → download → the PDF serves (in demo it's a placeholder by
   default, or the uploaded eBook if you set `EBOOK_DOWNLOAD_URL`).

---

## 5. Known serverless caveats (read before you rely on it)

| Concern | Status | Guidance |
| --- | --- | --- |
| **Database** | Postgres required. | Use Neon / Supabase / Vercel Postgres. Schema is portable. |
| **Media/file upload persistence** | Local driver won't persist on Vercel. | Set `STORAGE_DRIVER=vercel` + `BLOB_READ_WRITE_TOKEN` for durable uploads. |
| **Backups module** | SQLite file snapshot only works on a disk. | On serverless+Postgres the module returns `409` and points you to the platform's point-in-time recovery. Use Neon/Supabase native backups. |
| **In-memory rate limiter** | Per-instance only; resets across serverless cold starts and isn't shared between functions. | Fine for demo. For production, swap `src/lib/rate-limit.ts` for a Redis-backed store (the interface is tiny). |
| **`BackgroundJob` queue** | Model exists, no worker/consumer yet. | Jobs are queued but not processed automatically. Wire an external cron (see §6) or a queue (e.g. Upstash / Inngest) for real async delivery. |
| **Email** | `console` logs to Vercel logs. | Set `EMAIL_TRANSPORT=smtp` for real delivery. |
| **`SECURE_DOWNLOAD` / `EBOOK_DOWNLOAD_URL`** | Default downloads are a generated placeholder PDF. | For the real eBook, either upload it as an active **eBook version** (needs Blob) or point `EBOOK_DOWNLOAD_URL` at your asset/CDN. |

---

## 6. Optional: scheduled jobs (Vercel Cron)

To auto-process background jobs (e.g. abandoned-checkout reminders, retry failed
emails/webhooks) on serverless, add a cron route and a `vercel.json` cron entry. Example:

```json
{
  "crons": [
    { "path": "/api/cron/process-jobs", "schedule": "*/15 * * * *" }
  ]
}
```

Add the handler `src/app/api/cron/process-jobs/route.ts` that calls your job worker and
uses `Authorization: Bearer CRON_SECRET` (Vercel injects `CRON_SECRET`, and you should
verify it). **This is not yet built** — see the audit report.

---

## 7. Going live checklist

- [ ] Postgres connected; schema pushed; seed run.
- [ ] `ADMIN_EMAIL`/`ADMIN_PASSWORD` set to real values; dev bootstrap changed.
- [ ] `APP_URL` = your production URL.
- [ ] `ACCESS_TOKEN_SECRET` rotated to a strong random value.
- [ ] `PAYMENT_MODE=live` + real provider credentials (or keep `demo` for testing).
- [ ] `STORAGE_DRIVER=vercel` + Blob token (for durable eBook/media uploads).
- [ ] `EMAIL_TRANSPORT=smtp` + real SMTP.
- [ ] MFA enabled for every admin (Security page).
- [ ] Run the purchase → access → download flow once in production.
- [ ] Set `SECURITY` headers are already in `next.config.mjs` (CSP, etc.).

---

## 8. Rolling back

- Every Vercel deploy is immutable; choose a previous deployment in **Deployments →
  Promote** to roll back.
- Do **not** roll the database back independently — keep DB migrations additive.
