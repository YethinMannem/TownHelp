---
name: using-supabase
description: >
  Handles Supabase integration patterns for TownHelp including Auth,
  Realtime, Storage, and client configuration. Activates when working
  with authentication flows, magic links, OTP, user sync, SSR clients,
  or Supabase dashboard configuration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Supabase patterns

Two clients exist — never mix them:
- `src/lib/supabase/client.ts` — browser ('use client' components)
- `src/lib/supabase/server.ts` — SSR (Server Components, Route Handlers)

## Auth

Current: email magic link. Production swap: phone OTP + Google OAuth (config change only, zero code changes).

User sync is application-level in the auth callback route:
- New user → insert into `public.users`
- Returning user → update `lastLoginAt`

All auth operations go through `src/services/auth.service.ts`. Never call `supabase.auth` directly from components.

## Database access

Use Prisma for ALL CRUD. Supabase client is only for Auth, Realtime, Storage.

## Realtime (chat — upcoming)

Subscribe by conversation_id. Unsubscribe on component unmount.
