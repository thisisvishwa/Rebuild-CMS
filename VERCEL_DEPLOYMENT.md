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
  "buildCommand": "npm run db:sync-postgres && prisma generate --schema prisma/schema.postgresql.prisma && prisma db push --schema prisma/schema.postgresql.prisma && tsx prisma/seed.ts && next build",
  "installCommand": "npm install"
}
```

> The build does four things, in order:
> 1. **`db:sync-postgres`** — regenerates `schema.postgresql.prisma` from `schema.prisma`
>    so the Postgres copy always matches (they differ only by `provider`).
> 2. **`prisma generate`** against the Postgres schema — makes the generated client match
>    the production database.
> 3. **`prisma db push`** — **creates the database tables** (idempotent; safe on an empty
>    DB). This is what prevents `P2021 "table does not exist"` errors at runtime.
> 4. **`tsx prisma/seed.ts`** — **seeds** the super-admin, roles/permissions, product, CMS,
>    FAQs, legal, email templates, payment providers, and settings (idempotent upserts;
>    it won't reset an existing super-admin's password). This is what makes the admin
>    login work immediately after the first deploy.
>
> Because the build pushes the schema and seeds, a fresh project is fully
> **self-provisioning** — you don't need to run database commands manually. If your build
> env does not have `DATABASE_URL`, `db push` fails and the deploy aborts (see
> **Troubleshooting**).

**Runtime note:** Vercel's default Node runtime for Next.js 14 is fine. The heavy admin
routes (seed/backup/email) are within the default function time limits; if any route
times out, add `export const maxDuration = 60` to that specific route file.

> **Before the first deploy**, set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Vercel env so the
> seed creates *your* admin account. If left unset, the seed creates the dev bootstrap
> `admin@rebuild.local` / `AdminPass!2026`, which you must change on the **Admin Users**
> page right after login.

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

---

## 9. Troubleshooting — from the logs

These are the two failures seen on a fresh `rebuild-cms` deploy and how to fix each.

### 9a. `ERR_TOO_MANY_REDIRECTS` on `/admin/login` (infinite 307 loop)

**Symptom:** opening `/admin/login` (or `/admin`) shows "This page isn't working —
redirected you too many times" (`ERR_TOO_MANY_REDIRECTS`). Vercel logs show many
`GET /admin/login -> 307`.

**Cause (code bug, already fixed):** `/admin/login` was a child of `/admin`, so it
inherited `admin/layout.tsx`, which calls `requireAuth()` and does
`redirect("/admin/login")` when there's **no session**. Because the request was *already*
on `/admin/login`, it redirected to itself forever.

**Fix:** moved the auth-guarded shell into a `(protected)` route group so the login page
is a sibling that does **not** run the guard:

```
src/app/admin/
  (protected)/          <- all 31 dashboard pages + the guarded layout (sidebar/header)
  login/page.tsx        <- /admin/login, NOT wrapped by requireAuth()
```

- `/admin/login` (no cookie) now renders the form (HTTP **200**, no loop).
- `/admin` (no cookie) redirects once to `/admin/login` (correct).
- `/admin` (with cookie) returns **200**.

This needs a **redeploy** — the fix is in the pushed code, not an env var.

### 9b. `P2021: The table ... does not exist` → `/api/storefront` and `/api/checkout` return 500

**Symptom:** Vercel logs show `500` on `GET /api/storefront` and `POST /api/checkout`,
with the message:

```
PrismaClientKnownRequestError: Invalid `prisma.product.findFirst()` invocation:
The table `public.Product` does not exist in the current database.
(code: P2021)
```

**Cause:** the app **is** connecting to Postgres fine (`DATABASE_URL` is correct), but the
**tables were never created and never seeded** — the database provisioning step was
skipped. The storefront `/` still renders 200 because it falls back to bundled copy when
the API fails, which hides the problem.

**Fix (two options):**

Option A — **let the deployed app self-provision (recommended for the first deploy).**
The `vercel.json` build command now runs `prisma db push` (creates tables) and
`tsx prisma/seed.ts` (seeds super-admin + product + CMS) **during the build**, so you only
need to redeploy. Ensure `DATABASE_URL` is set in the project environment. This is what
the current `vercel.json` does.

Option B — **run provisioning once against the production DB** (if you prefer not to touch
the build):

```bash
# Windows (PowerShell) — from the project root, with your production Postgres URL:
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
$env:ADMIN_EMAIL="you@company.com"
$env:ADMIN_PASSWORD="A-STRONG-Unique-Password!"
npm run db:push:pg      # create all tables
npm run db:seed:pg      # seed super-admin, product, CMS, providers, templates
```

After the tables exist, `/api/storefront` and `/api/checkout` return 200 and the admin can
log in.

> **Note:** if a `prisma db push` in the build ever needs to drop/recreate a column and
> hangs waiting for confirmation (non-interactive shell), the deploy will stall. If that
> happens, run `prisma db push --accept-data-loss` locally once, or adopt Prisma Migrate
> (`prisma migrate dev` → commit migration SQL → `prisma migrate deploy` in the build) for
> full versioned schema control.

### 9c. Other things to confirm after deploy

- **`APP_URL`** set to your production URL (no trailing slash). Otherwise PayPal return,
  access links, and invoices point at `http://localhost:3000`.
- **`ACCESS_TOKEN_SECRET`** set to a long random value (not the dev fallback).
- **Email** uses `EMAIL_TRANSPORT=smtp` only when you've configured SMTP; otherwise it
  logs to Vercel function logs.
- **Media/upload persistence** requires `STORAGE_DRIVER=vercel` + a `BLOB_READ_WRITE_TOKEN`
  (otherwise uploads are ephemeral).
