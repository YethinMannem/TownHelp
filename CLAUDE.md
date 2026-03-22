# TownHelp — Engineering Standards

## Core Principles
- Quality over speed. Always.
- Understand every line before committing it.
- Every external dependency is wrapped in a service layer (swappable).
- TypeScript strict mode. No `any` types unless absolutely necessary.
- Shared types in src/types/ act as contracts between backend and frontend.

## Git Workflow
- Feature branches with PRs. Never push directly to main (except initial setup).
- Meaningful commit messages: feat:, fix:, chore:, refactor:, docs:
- Run `git status` before every commit — verify no secrets, no node_modules.
- .env files NEVER committed. Secrets stay local.

## Database Standards
- All tables use UUIDs as primary keys.
- snake_case for database columns (via Prisma @@map).
- camelCase for TypeScript model fields.
- Every table has created_at. Mutable tables also have updated_at.
- Soft deletes (deleted_at) on User and ProviderProfile.
- Decimal precision always specified: money = Decimal(10,2), ratings = Decimal(3,2).
- Composite indexes on hot query paths (provider discovery, user dashboards, chat).
- CHECK constraints for data integrity (no self-reviews, rating 1-5, no self-booking).
- Audit trail via BookingStatusLog for every state transition.

## Code Standards
- No copy-paste without understanding.
- Services layer: src/services/ wraps all external dependencies.
- Shared types: src/types/ defines data contracts.
- Components: src/components/ for reusable UI (Meghana's domain).
- Hooks: src/hooks/ for custom React hooks.
- Lib: src/lib/ for utility files (Supabase client, helpers).

## Team
- Yethin: Backend (schema, services, API, auth)
- Meghana: Frontend (components, pages, styling)
- Daily WhatsApp standups. Weekly integration sessions.
- Feature branches. PRs for review before merge.

## Tech Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM → Supabase PostgreSQL (Mumbai region)
- Supabase Auth (Phone OTP + Google) + Realtime + Storage
- Vercel hosting (PWA-first)

## Review Checklist (before every commit)
1. Does it work? (tested locally)
2. Is it typed properly? (no implicit any)
3. Are secrets safe? (git status check)
4. Is the commit message descriptive?
5. Would Meghana understand the interface? (types/contracts clear)
