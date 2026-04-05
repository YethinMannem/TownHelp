# TownHelp

TownHelp is a neighborhood services marketplace built with Next.js, React, Supabase, Prisma, and PostgreSQL.

It helps local customers discover trusted providers, book services, chat in-app, track booking status, manage favorites, receive notifications, and leave reviews. Providers can create profiles, define service areas, list services, manage availability, track bookings, and monitor dashboard stats.

## Highlights

- Customer and provider flows in a single application
- Service discovery by category, search term, and area
- Provider profiles with services, pricing, reviews, and service areas
- End-to-end booking lifecycle: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`
- In-app chat tied to bookings
- Unread message badges and in-app notifications
- Favorites and review flows
- Provider dashboard with booking and earnings stats
- Responsive mobile-first UI with desktop sidebar navigation

## Current Product Behavior

- Authentication uses Supabase.
- Data is stored in PostgreSQL through Prisma.
- Payments are currently tracked as offline payments.
- Online Razorpay route handlers exist as placeholders, but online checkout is intentionally disabled in the current app flow.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- Supabase Auth and Realtime
- Vitest
- ESLint

## Main User Flows

### Customers

- Sign up and sign in
- Browse providers by category or area
- Open a provider profile
- Create a booking
- Chat with the provider
- Mark offline payment as submitted
- Track booking status
- Save and remove favorites
- Read notifications
- Submit reviews after completed jobs

### Providers

- Register a provider profile
- Set service area, city, and state
- Add services and pricing
- Manage availability
- Receive booking requests
- Confirm, start, complete, or dispute bookings
- Confirm receipt of offline payments
- View dashboard stats and today’s schedule

## Project Structure

```text
src/
  app/
    actions/        Server actions for auth, bookings, chat, favorites, notifications, providers, reviews
    browse/         Provider discovery UI
    bookings/       Booking list, actions, payment confirmation UI
    chat/           Conversation list and conversation detail pages
    favorites/      Saved providers
    notifications/  Notification inbox
    provider/       Provider registration, dashboard, services, availability, profile pages
  components/
    layout/         Shared navigation
    ui/             Shared UI primitives and cards
    chat/           Chat input and chat-related client components
  lib/
    auth.ts         Auth and viewer context helpers
    prisma.ts       Prisma client bootstrap
    supabase/       Supabase server/client helpers
  services/
    *.service.ts    Business logic for bookings, chat, dashboard, notifications, payments, reviews
    __tests__/      Vitest coverage for core services
prisma/
  schema.prisma     Database schema
  seed.mjs          Seed script
```

## Environment Variables

Create a `.env` file from `.env.example`.

```bash
cp .env.example .env
```

Required values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_WEBHOOK_SECRET=
```

### Notes

- `DATABASE_URL` must point to a PostgreSQL database reachable by Prisma.
- Supabase auth must be configured for the app to work locally.
- Razorpay variables are present for future online payment support, but the current app flow uses offline payment confirmation.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Generate Prisma client

```bash
npx prisma generate
```

### 3. Run migrations

```bash
npx prisma migrate deploy
```

For local database iteration, you can also use:

```bash
npx prisma migrate dev
```

### 4. Optional: seed sample data

```bash
npx prisma db seed
```

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

If port `3000` is already in use, Next.js may try another free port. If you already have a TownHelp dev server running, stop the existing process first to avoid duplicate-server warnings.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run test:watch
npm run test:coverage
```

## Quality Checks

Recommended before opening a PR:

```bash
npm run lint
npm test
npm run build
```

## Data Model Overview

The app centers around a few core entities:

- `User`
- `ProviderProfile`
- `ProviderService`
- `ServiceArea`
- `Booking`
- `Conversation`
- `Message`
- `Payment`
- `Notification`
- `Review`
- `Favorite`

Important enums include:

- `BookingStatus`
- `PaymentStatus`
- `NotificationType`
- `MessageType`
- `RateType`

See `prisma/schema.prisma` for the full schema.

## Architecture Notes

### App Router

The project uses the Next.js App Router with:

- server-rendered pages for core data views
- server actions for authenticated mutations
- client components only where interactivity is needed

### Business Logic Layer

Most domain rules live in `src/services`, not directly in route handlers or UI components. This keeps the app easier to test and reason about.

Examples:

- booking state transitions
- chat authorization and unread counts
- provider dashboard calculations
- review aggregation
- notification reads and unread counts

### Auth and Viewer Context

`src/lib/auth.ts` provides shared auth helpers and a cached viewer context for:

- the authenticated app layout
- provider navigation behavior
- unread message badges
- user location label fallback logic

## Notifications and Messaging

TownHelp includes:

- conversation-level unread counts
- navigation badges for unread messages
- in-app notifications for bookings, messages, reviews, disputes, and payments
- auto-mark-read behavior for conversations

## Payments

TownHelp currently supports offline payment tracking:

- the requester confirms they paid in cash or by UPI
- the provider confirms receipt
- only confirmed completed payments are counted toward earnings

Online payments are intentionally disabled in the current UI/API flow.

## Responsive Design

The app is designed to work across:

- mobile phones
- tablets
- desktop screens

Shared navigation switches between:

- a mobile bottom navigation bar
- a desktop left sidebar

## Testing

Current automated coverage focuses on service-layer behavior:

- booking service
- chat service
- notification service
- review service

The repo does not currently include a full browser E2E suite, so if you want release-grade click-through coverage, adding Playwright is a strong next step.

## Known Limitations

- Online payments are not yet enabled
- There is no browser E2E test suite yet
- Some user location flows still rely on profile-backed data rather than a dedicated customer location settings page

## Recommended Next Improvements

- Add Playwright E2E coverage for login, booking, chat, notifications, and provider flows
- Add a dedicated user profile/settings page
- Add customer-managed location selection
- Enable production-ready online payments when the product is ready
- Add image/file messaging support if needed

## Contributing

If you are contributing locally:

1. Create a branch
2. Run lint, tests, and build before pushing
3. Keep business logic in `src/services` when possible
4. Prefer small, focused commits

## License

This repository currently does not declare a license. Add one before public distribution if needed.
