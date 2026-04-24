# TownHelp

Peer-to-peer neighborhood services marketplace for Hyderabad, India.  
Connect households with verified local maids, cooks, electricians, and more — book, chat, and pay without leaving the app.

---

## What it does

Customers open the app, browse nearby verified providers by category or locality, book a time slot, chat with the provider, and pay after the job is done. Providers get a dashboard to accept requests, track earnings, and manage availability. Every booking follows a state machine: `PENDING → CONFIRMED → IN_PROGRESS → COMPLETED`.

---

## User flows

### Customer

1. Open the app → sign up with email
2. Set your locality (e.g. "Madhapur", "Kondapur")
3. Browse providers by category (Maid, Cook, Electrician, etc.)
4. Tap a provider → view services, rates, reviews, availability
5. Book → pick date, time, and add notes
6. Provider accepts → you receive a 4-digit job code
7. Provider arrives → show them the code → job starts
8. Job done → pay in cash or UPI → mark payment submitted
9. Provider confirms receipt → leave a review

### Provider

1. Sign up → tap "Become a Provider"
2. Fill profile: display name, base rate, city, bio
3. Add services (e.g. Maid — ₹200/hour) and service areas
4. Set weekly availability (days + hours)
5. Dashboard shows pending requests → Accept or Decline
6. On arrival, customer shows job code → enter it to start
7. Mark job complete → confirm offline payment receipt
8. Track earnings and completed jobs on dashboard

### Install as app (no App Store needed)

**Android (Chrome):** three-dot menu → "Add to Home Screen" → Install  
**iPhone (Safari):** Share → "Add to Home Screen" → Add

The app installs as a PWA with the TownHelp icon on your home screen.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Supabase (Mumbai region) |
| ORM | Prisma 7 |
| Auth | Supabase Auth (email magic link → phone OTP for production) |
| Realtime | Supabase Realtime (chat) |
| Push notifications | Web Push (VAPID) |
| Payments | Offline tracking now; Razorpay wired for later |
| Hosting | Vercel |
| Tests | Vitest |

---

## Developer setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier works)
- Git

### 1. Clone and install

```bash
git clone https://github.com/YethinMannem/TownHelp.git
cd townhelp
npm install
```

### 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project → pick **Mumbai (ap-south-1)** region
2. Wait for it to provision (~2 minutes)
3. Go to **Settings → API** → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Go to **Settings → Database → Connection string → URI mode** → copy → `DATABASE_URL`

### 3. Set environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# From Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# From Supabase → Settings → Database → Connection string (URI)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Your email address — grants access to /admin/providers
ADMIN_EMAIL=you@example.com

# Razorpay — leave as placeholders for now (online payments disabled in UI)
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=placeholder
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_WEBHOOK_SECRET=placeholder

# Web Push — generate fresh keys with the command below
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_CONTACT_EMAIL=mailto:you@example.com
```

**Generate VAPID keys (required for push notifications):**

```bash
npx web-push generate-vapid-keys
```

Copy the two keys into the four `VAPID_*` variables — `PUBLIC_KEY` appears twice (once for client, once for server).

### 4. Set up the database

```bash
npx prisma generate          # Generate the Prisma client
npx prisma migrate deploy    # Apply all migrations to Supabase
npx prisma db seed           # Seed the 6 service categories
```

### 5. Enable email auth in Supabase

1. Go to **Authentication → Providers → Email** → enable it
2. For local dev: disable "Confirm email" so signup works instantly
3. Re-enable email confirmation before going to production

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Sign up → you land on the home screen. To test the provider side, go to `/provider/register`.

---

## Environment variables reference

| Variable | Where to get it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Yes |
| `DATABASE_URL` | Supabase → Settings → Database → URI | Yes |
| `ADMIN_EMAIL` | Your own email address | Yes |
| `RAZORPAY_KEY_ID` | Razorpay dashboard | No (offline payments only for now) |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard | No |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as KEY_ID | No |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Webhooks | No |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` | Yes |
| `VAPID_PUBLIC_KEY` | Same as above | Yes |
| `VAPID_PRIVATE_KEY` | Same as above | Yes |
| `VAPID_CONTACT_EMAIL` | `mailto:you@example.com` | Yes |

---

## Available commands

```bash
npm run dev           # Start local dev server
npm run build         # Production build (runs prisma generate first)
npm run start         # Start production server
npm run lint          # ESLint
npm test              # Run Vitest unit tests (76 tests, ~400ms)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Before every commit:**

```bash
npm run lint && npm test && npm run build
```

---

## Project structure

```
src/
├── app/
│   ├── actions/          # Server actions (auth, booking, chat, provider, review, …)
│   ├── browse/           # Provider discovery + search filters
│   ├── bookings/         # Booking list + detail + action buttons
│   ├── chat/             # Conversation list + message thread
│   ├── favorites/        # Saved providers
│   ├── notifications/    # Notification inbox
│   ├── provider/         # Register, dashboard, edit, availability, add-service
│   ├── admin/            # Provider verification (ADMIN_EMAIL only)
│   ├── help/             # FAQ + cancellation policy + support
│   └── profile/          # Account settings
├── components/
│   ├── layout/           # BottomNav, PageHeader
│   └── ui/               # Button, Badge, Card, ProviderCard, LocationSearch, …
├── services/             # Business logic (booking state machine, chat, reviews, …)
│   └── __tests__/        # Vitest unit tests
├── lib/
│   ├── auth.ts           # requireAuthUser, getViewerContext
│   ├── prisma.ts         # Prisma client singleton
│   ├── push.ts           # Web Push helpers
│   └── supabase/         # Browser + server Supabase clients
└── types/                # Shared TypeScript interfaces
prisma/
├── schema.prisma         # 16 tables, 14 enums, full relations
├── seed.mjs              # Seeds 6 service categories
└── migrations/           # Applied migrations — never edit these
public/
├── icons/                # PWA icons (192px, 512px SVG)
├── manifest.webmanifest  # PWA manifest
├── sw.js                 # Service worker
└── apple-touch-icon.png  # iPhone home screen icon
```

---

## Architecture decisions

**Server Actions over API routes** — mutations go through `src/app/actions/`. Auth checks are co-located with business logic. No separate API layer to maintain.

**Service layer** — domain rules live in `src/services/`, not in actions or components. This is what makes the Vitest suite possible without a running server.

**Single User table** — a person can be both requester and provider. The `ProviderProfile` is a separate record linked by `userId`. No need for two accounts.

**Offline payments first** — Razorpay is wired but disabled in the UI. Cash/UPI is how most Hyderabad service workers get paid. Ships faster, less friction for launch.

**PWA over native app** — no App Store, no review cycle, no separate codebase. Users install via "Add to Home Screen". Works on Android and iPhone from day one.

---

## Database schema (16 tables)

Core: `User`, `ProviderProfile`, `ServiceCategory`, `ProviderService`, `Booking`, `BookingStatusLog`, `Review`  
Communication: `Conversation`, `Message`  
Discovery: `Favorite`, `ProviderAvailability`, `ServiceArea`  
Safety: `Report`, `Notification`, `AdminAction`

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema with indexes and constraints.

---

## Running migrations

```bash
# Development — creates a new migration file
npx prisma migrate dev --name describe-your-change

# Production / staging — applies existing migrations without creating new files
npx prisma migrate deploy
```

Never edit files inside `prisma/migrations/`. Always create a new migration for schema changes.

---

## Switching to production auth

The app ships with email magic link. To enable production auth — zero code changes needed:

- **Phone OTP:** enable Twilio SMS in Supabase → Authentication → Providers → Phone
- **Google Sign-In:** add OAuth credentials in Supabase → Authentication → Providers → Google

The auth callback auto-detects the provider.

---

## Testing

```bash
npm test
```

76 unit tests, ~400ms. Covers:

- Booking state machine transitions and role-based permissions
- Chat authorization and unread counts
- Review validation and rating aggregation
- Notification pagination and mark-as-read

No browser E2E suite yet. Adding Playwright is the recommended next step.

---

## Deployment

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env` in Vercel project settings
4. Deploy — `npm run build` runs `prisma generate` automatically

Every push to `main` deploys to production.

---

## Team

| Person | Role |
|---|---|
| Yethin | Backend — schema, services, API, auth, DevOps |
| Meghana | Frontend — components, pages, styling, UX |

Built for Hyderabad. Starting in Madhapur.

---

## License

Private — all rights reserved.
