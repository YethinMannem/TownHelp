# TownHelp — Project Context for Claude Code

> Peer-to-peer neighborhood services marketplace for Hyderabad, India.
> Connecting households with verified local service providers.

## Team

- **Yethin** (Backend): Schema, services, API routes, auth, database, DevOps.
- **Meghana** (Frontend): Components, pages, styling, animations, UX.
- **Claude** (Technical Cofounder): Architecture, code review, quality enforcement, mentorship.

Communication: Daily WhatsApp standups. Weekly integration sessions.

## Core Principles

- Quality over speed. Always.
- Understand every line before committing it.
- No copy-paste without understanding.
- Every external dependency is wrapped in a service layer (swappable).
- Build toward the shortest path to a real booking between a real requester and a real provider.

## Tech Stack

- Next.js 15 (App Router) + TypeScript strict mode + Tailwind CSS
- Prisma ORM → Supabase PostgreSQL (Mumbai region)
- Supabase Auth (Email magic link for dev, Phone OTP + Google for production)
- Supabase Realtime + Storage
- Vercel hosting (PWA-first)
- GitHub repo: `YethinMannem/TownHelp`

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
│   ├── login/        # Auth pages (sign in / sign up)
│   ├── auth/callback # OAuth/magic link callback handler
│   └── page.tsx      # Home (protected, redirects if not authenticated)
├── services/         # Wrapper layer for all external deps (Yethin's domain)
│   └── auth.service.ts  # Provider-agnostic auth service
├── types/            # Shared TypeScript type definitions (contracts)
├── components/       # Reusable UI components (Meghana's domain)
├── hooks/            # Custom React hooks
└── lib/              # Utility files
    ├── supabase/
    │   ├── client.ts    # Browser-side Supabase client
    │   └── server.ts    # SSR-aware Supabase client
    └── ...
prisma/
├── schema.prisma     # 16 tables, 14 enums, full relations
├── seed.mjs          # Seeds 6 service categories
└── migrations/       # Applied migrations
docs/                 # ERD diagrams (Mermaid), architecture docs
```

## Database Schema (16 tables)

### Core Tables
- **User** — every person who signs up (synced from Supabase auth.users)
- **ProviderProfile** — extra info for users who offer services
- **ServiceCategory** — the 6 launch categories
- **ProviderService** — junction: which providers offer which services
- **Booking** — when a requester hires a provider
- **BookingStatusLog** — audit trail for every booking state transition
- **Review** — ratings and feedback after completed bookings

### Communication
- **Conversation** — chat thread between two users
- **Message** — individual messages within conversations

### Discovery & Trust
- **Favorite** — users save preferred providers
- **ProviderAvailability** — weekly schedule slots
- **ServiceArea** — geographic areas a provider serves

### Safety & Admin
- **Report** — user-submitted reports for disputes
- **Notification** — in-app notifications
- **AdminAction** — admin moderation log

### Key Design Decisions
- Single User table + separate ProviderProfile (a person can be both requester and provider)
- UUIDs as primary keys on all tables
- Soft deletes (deleted_at) on User and ProviderProfile
- JSONB for flexible metadata fields
- Conversation model separates chat threads from messages
- BookingStatusLog provides full audit trail

### Enums (14 total)
AuthProvider, UserStatus, ProviderVerificationStatus, Gender,
BookingStatus, BookingCancellationReason, PaymentStatus, PaymentMethod,
ReviewType, MessageType, MessageStatus, NotificationType,
ReportStatus, AdminActionType

### Service Categories (6 for launch)
Maid/Cleaning, Cook/Tiffin, Electrician/Plumber, Dhobi/Laundry, Tutoring, Pickup/Drop

## Database Standards

- snake_case for database columns (via Prisma @@map)
- camelCase for TypeScript model fields
- Every table has created_at; mutable tables also have updated_at
- Decimal precision always specified: money = Decimal(10,2), ratings = Decimal(3,2)
- Composite indexes on hot query paths (provider discovery, user dashboards, chat)
- CHECK constraints for data integrity (no self-reviews, rating 1-5, no self-booking)
- Partial indexes on soft-delete columns

## Authentication (Session 3 — Complete)

- Email magic link for development; Phone OTP swap for production (one config change)
- Application-level user sync: auth.users → public.users on every login
- Login page with Sign In/Sign Up toggle, name validation for new users
- Auth callback route with dynamic provider detection
- SSR-aware Supabase clients (browser + server)
- Auth service wrapper in src/services/auth.service.ts (provider-agnostic)
- Route protection via server-side checks (not deprecated middleware)
- EMAIL added to AuthProvider enum

### Production Auth Swap (when launching)
- Enable Twilio SMS in Supabase → phone OTP works immediately
- Add Google OAuth credentials → Google sign-in works immediately
- Callback route auto-detects provider — zero code changes needed

## Code Standards

- TypeScript strict mode. No `any` types unless absolutely necessary.
- Services layer: src/services/ wraps all external dependencies.
- Shared types: src/types/ defines data contracts between Yethin and Meghana.
- Components: src/components/ for reusable UI (Meghana's domain).
- Hooks: src/hooks/ for custom React hooks.
- Lib: src/lib/ for utility files (Supabase client, helpers).
- No inline styles — use Tailwind utility classes.
- Error handling: always use try/catch, never swallow errors silently.
- Console.error for error logging (will be replaced with proper logging later).

## Git Workflow

- Feature branches with PRs. Never push directly to main (except initial setup phase).
- Conventional Commits format: `type(scope): short description`
  - Types: feat, fix, chore, refactor, docs, test, style, perf
  - Subject line: max 72 chars, imperative mood
  - Body: what and why, not how. Wrap at 72 chars.
  - No fake metadata (e.g., fake Reviewed-by trailers)
- Run `git status` before every commit — verify no secrets, no node_modules.
- .env files NEVER committed. Secrets stay local.

## Review Checklist (before every commit)

1. Does it work? (tested locally)
2. Is it typed properly? (no implicit any)
3. Are secrets safe? (git status check)
4. Is the commit message following Conventional Commits?
5. Would Meghana understand the interface? (types/contracts clear)

## Current Progress

- [x] Session 1: Project scaffolding (Next.js + Tailwind + Prisma + Supabase)
- [x] Session 2: Database schema (16 tables, 14 enums, indexes, seed data)
- [x] Session 3: Authentication (email magic link, user sync, protected routes)
- [ ] Session 4: Provider profiles + service listings OR browse/search providers
- [ ] Core booking flow
- [ ] Chat (Supabase Realtime)
- [ ] Reviews
- [ ] Launch MVP to one apartment complex in Madhapur

## North Star

The shortest path to a real booking between a real requester and a real provider in Hyderabad. Everything else comes after real users tell us they need it.
