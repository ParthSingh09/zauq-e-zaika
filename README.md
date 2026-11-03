# Zauq e Zaika — *Har Zaika, Dil Se ♡*

The website for **Zauq e Zaika**, a homemade Indian food brand. It brings three things together:

1. **A brand website** with the story, philosophy and contact details.
2. **A recipe platform** with search, filters, a servings scaler, ratings, favourites, printing and YouTube videos.
3. **An online shop** for homemade food: cart, checkout, delivery areas, Razorpay-ready payments and order tracking.

Everything is managed from a private **admin dashboard** at `/admin`, backed by a PostgreSQL database.

> **Sample content:** the recipes (Kheer Puri first), the four demonstration products, the About story and all policy pages are clearly marked placeholders. Every one of them can be edited or replaced from the admin dashboard. Nothing on the site claims real prices, reviews, delivery areas, certifications or founder details.

---

## Contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Admin login](#admin-login)
- [Adding recipes, products and videos](#adding-recipes-products-and-videos)
- [Opening the shop and connecting payments](#opening-the-shop-and-connecting-payments)
- [Deploying to Vercel + Supabase](#deploying-to-vercel--supabase)
- [Security](#security)
- [SEO](#seo)
- [Testing that was done](#testing-that-was-done)
- [Before launch: what you still need to provide](#before-launch-what-you-still-need-to-provide)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4 with custom design tokens (`src/app/globals.css`); Fraunces and DM Sans fonts |
| Database | PostgreSQL through Prisma 6 (Supabase in production; embedded Postgres for local development) |
| Auth | Custom session auth: bcrypt password hashes, random session tokens stored only as SHA-256 hashes, httpOnly cookies, `ADMIN` / `CUSTOMER` roles |
| Images | Local disk in development, Supabase Storage in production (`STORAGE_DRIVER`) |
| Payments | Razorpay (Orders API + signature verification + webhook), off until keys are supplied |
| Hosting | Vercel |

## Project structure

```
prisma/
  schema.prisma          Database schema (users, recipes, products, orders, content…)
  migrations/            SQL migrations
  seed.ts, seed-pages.ts Sample content and editable policy templates
scripts/
  local-db.mjs           Starts a local PostgreSQL server (no Docker needed)
  generate-placeholders.mjs  Regenerates the placeholder artwork
public/
  brand/                 Logo mark (SVG + PNG)
  images/placeholders/   Labelled placeholder food artwork (replace with real photos)
src/
  app/
    (site)/              Public website: home, recipes, videos, shop, cart, checkout,
                         orders, account, about, contact, faq, policies
    admin/(auth)/login   Admin sign-in
    admin/(panel)/       Admin dashboard (protected)
    api/                 Upload, cart quote, Razorpay verify + webhook, CSV export, view counter
    sitemap.ts, robots.ts, icon.svg, opengraph-image.png
  components/            UI components (layout, recipes, shop, video, admin, account, ui)
  lib/                   Database, auth, settings, queries, SEO, storage, Razorpay, orders
  server/actions/        Server Actions (public forms, account, checkout, admin/*)
  middleware.ts          Fast redirect for signed-out visitors on /admin and /account
```

## Local development

You need **Node.js 20+**. Docker and a separate Postgres install are not required.

```bash
npm install
cp .env.example .env            # then fill in the values below
```

For local work, set these in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/zauqezaika"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/zauqezaika"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="a-strong-password-of-10+-chars"
```

Then, in **two terminals**:

```bash
# Terminal 1: local PostgreSQL (keep it running)
npm run db:local

# Terminal 2
npm run db:migrate     # create the tables
npm run db:seed        # admin account + sample content
npm run dev            # http://localhost:3000
```

Other useful scripts:

| Command | Purpose |
|---|---|
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run db:deploy` | Apply migrations in production |

> `npm run build` pre-renders pages from the database, so `DATABASE_URL` must be reachable during the build.

## Environment variables

`.env.example` lists every variable. **Never commit real values.** Secrets are only read on the server and are never prefixed with `NEXT_PUBLIC_`.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | e.g. `https://zauqezaika.com`. Used for canonical URLs, the sitemap and Open Graph. |
| `DATABASE_URL` | ✅ | Supabase **pooled** connection string (port 6543, add `?pgbouncer=true`) |
| `DIRECT_URL` | ✅ | Supabase **direct** connection string (port 5432), used by migrations |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | for seeding | The first admin account, created by `npm run db:seed` |
| `STORAGE_DRIVER` | ✅ in prod | `supabase` in production; `local` for development only |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | ✅ in prod | Used for image uploads. The service-role key is server-only. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | optional | Online payments stay off until these are set |
| `RAZORPAY_WEBHOOK_SECRET` | with Razorpay | Lets Razorpay confirm payments server-to-server |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional | Turns on "Continue with Google" for customers and admins. The button stays hidden until both are set. |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | optional | Turns on one-click import of your latest uploads in the admin |

**Admin → Admins & security** shows which of these are configured, without revealing their values.

## Admin login

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (10+ characters), then run `npm run db:seed`. Running it again never overwrites your content.
2. Sign in at **`/admin/login`**.
3. Change the password straight away under **Admins & security**. You can add more admins there too.

Admin pages, server actions and API routes each check for a valid session with the `ADMIN` role on the server. Customer accounts cannot reach any of them.

### Google sign-in (OAuth)

1. In [Google Cloud Console](https://console.cloud.google.com/) create a project → **APIs & Services → OAuth consent screen** (External; app name "Zauq e Zaika"; add your support email).
2. **Credentials → Create credentials → OAuth client ID → Web application.** Add the authorised redirect URI `https://YOUR-DOMAIN/api/auth/google/callback` (and `http://localhost:3000/api/auth/google/callback` for local work).
3. Copy the client ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Vercel → Settings → Environment Variables) and redeploy.
4. Publish the consent screen ("In production") so any Google user can sign in, not only test users.

How it works: authorization-code flow with PKCE and a `state` check; the code is exchanged server-to-server and the ID token's issuer, audience, expiry and verified-email claims are checked. A Google sign-in links to an existing account with the same verified email, or creates a new customer. On `/admin/login` it only works for accounts that already have the admin role, so Google can never grant admin access. Google-only accounts can set a password later under **My Account**.

## Adding recipes, products and videos

**Recipes:** **Admin → Recipes → Add recipe**
- Title, short description (shown on cards and in Google), and an introduction. The introduction supports **bold**, *italic*, links, lists and headings.
- **Ingredients:** one row per ingredient, with an optional group (e.g. "For the puris"), quantity, unit, name and note. Numeric quantities scale automatically when visitors change the servings. Leave the quantity blank for "to taste" items.
- **Method:** steps can be reordered with the arrows.
- Tips, substitutions, optional nutrition (fill this in only with reliable figures), a YouTube link, category, diet, difficulty, times and servings.
- Upload a photo and write its alt text.
- Tick **Published** to make it live. Untick **Mark as sample content** once it is your real recipe.
- To replace Kheer Puri, open it from the Recipes list and edit it.

**Products:** **Admin → Products → Add product**
- Name, descriptions, up to 8 photos (the first is the main image), price in ₹, and an optional compare-at price.
- **Options** (e.g. 250 g / 500 g), each with its own price and stock.
- **Track stock** prevents overselling. Leave it off for made-to-order items.
- Ingredients, allergens, weight and shelf life.
- Set the status to **Active** to show the product in the shop. Untick **Demonstration product** for real items.
- Remove or replace the four "(Demo)" products before launch. Deleting a product that already has orders archives it instead, so order history is kept.

**Categories:** **Admin → Categories** (recipe and product categories, including images and display order).

**Videos:** **Admin → Videos**. Paste a YouTube link, add a title and the publish date, and optionally link it to a recipe. With `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` set, an **Import latest uploads** button also appears. Videos load only when a visitor presses play, which keeps pages fast.

**Content:** **Admin → Homepage & content** covers the announcement bar, hero banner, homepage sections, contact details, WhatsApp and social links. **Admin → Pages & policies** covers About, FAQ and the six policy pages.

**Testimonials:** **Admin → Testimonials**. Add only genuine customer feedback, with permission. The homepage shows a "share your experience" invitation until at least one testimonial is published.

## Opening the shop and connecting payments

Ordering is **off by default**: the shop is visible, but checkout is disabled and products are marked as demonstrations.

When your catalogue, prices and policies are final:

1. **Admin → Shop & delivery → Delivery areas:** add each area you serve, with PIN codes or prefixes (e.g. `1100` matches every PIN starting with 1100), the delivery charge, an optional free-delivery threshold and a minimum order. Customers can only order delivery to these PIN codes.
2. In **Shop settings**, set pickup details, preparation time, order cut-off and payment methods.
3. Tick **Accept orders (enable checkout)**.

**Pay on delivery / pickup** works without any further setup. You confirm these orders yourself and mark them paid in the admin.

**Razorpay (online payments):**
1. Create a Razorpay account and complete KYC. Start with **Test Mode** keys (`rzp_test_…`).
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel and redeploy.
3. In Razorpay Dashboard → **Webhooks**, add `https://YOUR-DOMAIN/api/payments/razorpay/webhook` with the events `payment.captured`, `payment.failed` and `refund.processed`. Set a secret and save it as `RAZORPAY_WEBHOOK_SECRET`.
4. Tick **Online payments via Razorpay** in Shop settings.
5. Place test orders with Razorpay's test cards or UPI IDs. When everything works, swap in your **live** keys.

How the payment flow works: the server re-prices the cart from the database, creates the order and a Razorpay order, and the customer pays in Razorpay's secure window. The payment signature is then verified on the server (HMAC-SHA256), and the webhook confirms the payment even if the customer closes the browser. **Card details never touch this website.** Refunds are issued from the Razorpay dashboard; then set the order's payment status to "Refunded".

**Order management:** **Admin → Orders** lets you filter by status, search, update the status and payment status, add notes to the order history, and cancel (a note is required, and tracked stock is returned automatically). Customers follow their order on its private order page, in **My Account**, or at `/track-order` using their order number and email.

## Deploying to Vercel + Supabase

1. **Supabase:** create a project (pick a region close to your customers, e.g. Mumbai).
   - Settings → Database → copy the pooled (6543) and direct (5432) connection strings.
   - Storage → create a **public** bucket called `media`.
   - Settings → API → copy the Project URL and the `service_role` key.
2. **Vercel:** import the Git repository.
   - Add all the environment variables listed above for the Production environment, with `STORAGE_DRIVER=supabase`.
   - Build command: `npm run build` (the default).
3. **Run the migrations and seed** once against the production database from your computer:
   ```bash
   DATABASE_URL="<direct url>" DIRECT_URL="<direct url>" npx prisma migrate deploy
   DATABASE_URL="<direct url>" DIRECT_URL="<direct url>" ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:seed
   ```
   Then redeploy, so the build pre-renders from the seeded database.
4. Add your custom domain in Vercel, set `NEXT_PUBLIC_SITE_URL` to it, and redeploy.
5. Submit `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console.

After each later schema change, run `npm run db:deploy` (with `DIRECT_URL` set) before deploying.

## Security

- **Passwords:** bcrypt (cost 12). Sign-in is rate-limited per IP and per account, and timing is kept similar whether or not the account exists. Changing a password signs out other devices.
- **Sessions:** 256-bit random tokens, stored only as SHA-256 hashes, in httpOnly, SameSite=Lax cookies that are Secure in production.
- **Authorisation:** checked on the server in every admin page, server action and API route. Middleware only adds a fast redirect for signed-out visitors.
- **Input:** validated on the server with Zod. Prices are always recomputed on the server, and client prices are never trusted.
- **Rate limits:** stored in the database (so they work across serverless instances) on login, registration, contact, newsletter, checkout, order tracking, uploads and payment verification.
- **Spam protection:** a honeypot field plus a minimum fill time on public forms.
- **Uploads:** admin-only, 5 MB maximum, file type detected from the actual bytes (JPG/PNG/WebP/AVIF only), random filenames.
- **Content safety:** admin-edited pages use a safe markdown renderer (no raw HTML), structured data is escaped, CSV exports are protected against formula injection, redirect targets are validated, and image/link URLs are restricted to `https://` or site-relative paths.
- **Headers:** HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a CSP with `frame-ancestors`, `object-src` and `base-uri` rules. The admin area is sent with `noindex`.
- **Orders:** guests reach their order only through a secret link. Payment webhooks and callbacks are verified by signature.

## SEO

- Unique titles, meta descriptions, canonical URLs, and Open Graph and Twitter cards on every page, plus a default share image.
- `sitemap.xml` (recipes, categories, real products, pages) and `robots.txt`. The admin, account, cart and checkout pages are excluded.
- Structured data:
  - **Recipe** on recipe pages, with times, ingredients and steps. Ratings appear only when real reviews exist, nutrition only when you enter it, and video only when the video has a publish date.
  - **Product** only on real products with real prices.
  - **Organization**, **WebSite** (with sitelinks search), **BreadcrumbList**, **FAQPage** and **ItemList** where they apply.
- Clean URLs (e.g. `/recipes/kheer-puri`), semantic HTML, alt text, internal linking through categories and related recipes, optimised images (AVIF/WebP) and click-to-load videos.

## Testing that was done

- Production build, TypeScript and ESLint all pass.
- Automated browser tests (headless Chrome) covered:
  - **Admin:** login (a wrong password is rejected); dashboard; image upload (a disguised non-image is rejected); recipe create → published page → serving scaler → structured data → search → unpublish (404) → delete; product create with options and stock; shop and delivery settings; content edit showing on the homepage.
  - **Customer:** contact form (validation, input kept after an error, success); newsletter; register (a weak password is rejected); save recipe; review (real rating appears in the structured data); demo product cannot be bought; options, stock cap and wishlist; server-priced cart; checkout (unserviceable PIN blocked, terms required, free-delivery threshold applied); order confirmation; cart cleared; stock decremented; account history.
  - **Orders:** guest order page hidden without its link; tracking by number + email; customers blocked from the admin; admin status updates shown to the customer; cancellation requires a note and returns stock; admin sees the enquiries, subscribers (CSV) and reviews.
- Razorpay payment and webhook signature checks were unit-tested with test secrets. Live payments have **not** been tested, because no keys are configured.
- Responsive and accessibility audit of every public and admin page at 360 / 768 / 1440 px found no horizontal scrolling, missing alt text, unlabeled inputs or heading problems. The mobile menu works with the keyboard.
- Missing recipes, products, categories and pages return a real 404.

## Before launch: what you still need to provide

**Content**
- [ ] Your authentic recipes, to replace the six sample recipes (start with Kheer Puri)
- [ ] Real food photography for recipes, products, the hero, the About page and categories
- [ ] Your logo as a transparent PNG or SVG (a text logo is used for now: `src/components/layout/Logo.tsx`)
- [ ] Your personal story for the About page
- [ ] YouTube video links (or API key + channel ID)
- [ ] Instagram and other social links, email, phone and WhatsApp number

**Business & legal**
- [ ] Legal business name, address and grievance officer for the policies
- [ ] **FSSAI** registration or licence number (needed to sell food in India)
- [ ] GST details, if applicable, and how taxes appear in prices
- [ ] Final product catalogue: prices, sizes, ingredients, allergens, shelf life
- [ ] Delivery areas (PIN codes), charges, minimum order, preparation time and cut-off
- [ ] Pickup address and hours, if offered
- [ ] Refund, cancellation and delivery terms, then a **legal review** of all six policy pages (untick "needs review" on each when it's done)

**Accounts & credentials**
- [ ] Supabase project (database + storage bucket)
- [ ] Vercel project and your domain
- [ ] Razorpay account with KYC, test keys first, then live keys and a webhook secret
- [ ] Optional: YouTube Data API key; an analytics provider (Vercel Analytics or GA4, which would also need a cookie consent banner)

**Possible next steps** (each needs a third-party service): order and enquiry email notifications and customer password reset (both need an email provider such as Resend or Brevo), sending newsletters, and analytics on the dashboard.
