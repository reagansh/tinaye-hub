# Tinaye-Hub: ZIMSEC Primary Shona Learning Platform (Grades 1–7)

Tinaye-Hub is a secure, offline-first, copyright-safe EdTech platform designed specifically for Zimbabwean primary students (Grades 1–7) modeled after Khan Academy. It features:
- **Low-bandwidth Vercel Edge Architecture** optimized for Southern Africa.
- **PWA Service Worker + Dexie.js (IndexedDB)** for uninterrupted offline learning in rural environments.
- **Automated Sunday Parent Digest Reports** (Vercel Cron + Resend) with actionable improvement recommendations.
- **$1.00/Month Micro-Subscription & Pay-What-You-Want Donations** via Stripe.
- **Compassionate Socratic Shona AI Hints** guiding students through grammatical errors without giving away answers.
- **Copyright-Safe Conceptual Syllabi** abstracting ZIMSEC primary learning objectives.

---

## 1. Architecture Overview

```mermaid
graph TD
    Client["PWA Client (Offline-First / Dexie.js)"]
    SW["Service Worker (Cache-First / Stale-While-Revalidate)"]
    VercelEdge["Vercel Edge Network (JNB / CPT PoPs)"]
    VercelServerless["Vercel Serverless API Functions"]
    PostgreSQL["Managed PostgreSQL (Supabase / Render)"]
    Stripe["Stripe Checkout & Webhooks ($1/Mo or Donation)"]
    VercelCron["Vercel Cron (Sundays 16:00 UTC / 18:00 CAT)"]
    Resend["Resend Email Dispatcher"]

    Client <-->|IndexedDB Offline Cache| SW
    SW <-->|Edge Cached Curriculum JSON| VercelEdge
    Client -->|Batched Offline Sync /api/sync| VercelServerless
    VercelServerless <-->|Prisma ORM (Connection Pool)| PostgreSQL
    Client -->|Initiate Checkout| Stripe
    Stripe -->|Webhooks /api/webhooks/stripe| VercelServerless
    VercelCron -->|Trigger /api/cron/parent-digest| VercelServerless
    VercelServerless -->|HTML Report Card Digests| Resend
    Resend -->|Email Delivery| Parent["Registered Parents"]
```

---

## 2. Directory Structure

```text
├── vercel.json                           # Vercel cron, edge cache headers, and resource allocation
├── prisma/
│   ├── schema.prisma                     # Relational models: Users, Children, Subscriptions, Mastery
│   └── init.sql                          # Raw SQL migration for Supabase / Render
├── lib/
│   ├── db.ts                             # Prisma Client connection pool singleton
│   ├── auth.ts                           # Bcrypt hashing, JWT generation, HTTP-only cookie guards
│   ├── stripe.ts                         # $1/mo micro-subscription & pay-what-you-want sessions
│   ├── offline/
│   │   ├── db.ts                         # Dexie.js IndexedDB schema for client offline caching
│   │   └── sync-manager.ts               # Background sync engine & optimistic streak updates
│   ├── curriculum/
│   │   └── zimsec-framework.ts           # Grades 1–7 original copyright-safe competency framework
│   ├── pedagogy/
│   │   └── socratic-hints.ts             # Compassionate Shona Socratic hint engine
│   ├── analytics/
│   │   └── digest-generator.ts           # Weekly progress compiler & weakness analyzer
│   └── email/
│       ├── send-email.ts                 # Resend API dispatcher
│       └── templates/
│           └── ParentWeeklyDigestEmail.ts # Responsive localized HTML parent report template
├── app/
│   ├── globals.css                       # Modern Zimbabwean heritage design system
│   ├── layout.tsx                        # Root layout with PWA service worker script
│   ├── page.tsx                          # Interactive client UI with Khan Academy learning map
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts         # Parent account registration
│       │   ├── login/route.ts            # Parent authentication
│       │   └── child-login/route.ts      # Sibling profile switch with PIN verification
│       ├── parent/
│       │   └── children/route.ts         # Child profile provisioning
│       ├── billing/
│       │   └── checkout/route.ts         # Stripe checkout session generator
│       ├── webhooks/
│       │   └── stripe/route.ts           # Stripe webhook listener
│       ├── cron/
│       │   └── parent-digest/route.ts    # Sunday automated parent report card engine
│       ├── sync/route.ts                 # Offline batch attempt synchronization
│       └── curriculum/route.ts           # Edge-cached curriculum pack delivery
└── public/
    ├── sw.js                             # PWA service worker caching rules
    ├── manifest.json                     # PWA manifest
    └── offline.html                      # Offline fallback screen
```

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js 18+ (tested on v24.19)
- npm 9+
- PostgreSQL database (Supabase, Neon, or local instance)

### Setup Steps
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Provide your PostgreSQL URL, Stripe test keys, Resend API key, and a random `JWT_SECRET` and `CRON_SECRET`.

3. **Initialize Database**:
   ```bash
   npx prisma db push
   ```
   *(Or run `prisma/init.sql` directly inside the Supabase SQL Editor).*

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to explore the interactive platform.

---

## 4. Vercel Deployment & Production Setup

1. **Deploy to Vercel**:
   Push to GitHub or run `vercel`:
   ```bash
   vercel --prod
   ```

2. **Configure Vercel Environment Variables**:
   In the Vercel Project Dashboard (`Settings -> Environment Variables`), add:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `COOKIE_NAME`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_PRICE_ID_MICRO_1USD`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`

3. **Vercel Cron Verification**:
   The `vercel.json` schedules the weekly digest every Sunday at `0 16 * * 0` (16:00 UTC / 18:00 CAT).
   Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header. You can also manually trigger it:
   ```bash
   curl -X GET https://your-deployment.vercel.app/api/cron/parent-digest \
     -H "Authorization: Bearer your-cron-secret"
   ```

4. **Stripe Webhook Configuration**:
   In your Stripe Dashboard (`Developers -> Webhooks`), add endpoint:
   `https://your-deployment.vercel.app/api/webhooks/stripe`
   Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
