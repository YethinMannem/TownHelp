# TownHelp Frontend Redesign — Design Spec

**Date:** 2026-04-02
**Author:** Meghana (Frontend), Claude (Technical Cofounder)
**Status:** Approved — ready for implementation planning

---

## 1. Overview

Full UI/UX overhaul of the TownHelp frontend using a design reference produced in
Stitch (19 screens). The goal is a warm, trustworthy, Indian-market feel that makes
users instantly know what to tap. No backend changes are required.

**Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Tailwind CSS v4 ·
Lucide React ≥ 0.400.0 (icons) · next/font/google (fonts)

**Design reference:** Stitch zip at `/Users/meghanabasani/Downloads/stitch-2.zip`

---

## 2. Design System

### 2.1 Color Tokens (Material Design 3)

All tokens defined via Tailwind v4 **plain `@theme {}`** directive (NOT `@theme inline`)
in `src/app/globals.css`. Plain `@theme` generates utility classes (`bg-primary`,
`text-on-surface`, etc.). `@theme inline` only maps to existing CSS variables and will
NOT generate utilities — do not use it.

**Placement:** The `@theme {}` block must be **top-level** in the CSS file — NOT nested
inside any `@layer base`, `@layer utilities`, or any other block. Tailwind v4 only
registers custom tokens when `@theme` is at the root level.

```css
@import "tailwindcss";

/* ✅ Correct — top-level @theme */
@theme {
  --color-primary: #4e644f;
  --color-primary-fixed: #d0e9ce;
  /* ... all tokens ... */
}

/* ❌ Wrong — do NOT nest inside @layer */
/* @layer base { @theme { ... } } */
```

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#4e644f` | Forest green — primary actions, active states |
| `--color-primary-fixed` | `#d0e9ce` | Light sage — active nav pill, icon backgrounds |
| `--color-primary-fixed-dim` | `#b4cdb3` | Dimmed sage |
| `--color-primary-container` | `#88a088` | Mid green — gradient end |
| `--color-on-primary` | `#ffffff` | Text on primary |
| `--color-on-primary-fixed` | `#0b200f` | Text on primary-fixed |
| `--color-secondary` | `#6a5c4e` | Warm brown — secondary text, icons |
| `--color-secondary-fixed` | `#f3dfce` | Warm peach — secondary button bg, icon bg |
| `--color-tertiary` | `#3d6282` | Steel blue — info, availability, links |
| `--color-tertiary-fixed` | `#cde5ff` | Light blue — laundry category bg |
| `--color-surface` | `#fbf9f7` | Warm white — page background |
| `--color-surface-container-lowest` | `#ffffff` | Pure white — card backgrounds |
| `--color-surface-container-low` | `#f5f3f1` | Slightly off-white |
| `--color-surface-container` | `#efedec` | Input backgrounds, dividers |
| `--color-surface-container-high` | `#eae8e6` | Stronger surface |
| `--color-surface-dim` | `#dbdad8` | Disabled states |
| `--color-on-surface` | `#1b1c1b` | Near black — primary text |
| `--color-on-surface-variant` | `#434842` | Secondary text |
| `--color-outline` | `#737971` | Borders, placeholder text |
| `--color-outline-variant` | `#c3c8c0` | Subtle borders |
| `--color-error` | `#ba1a1a` | Error states |
| `--color-error-container` | `#ffdad6` | Error bg (electrician category bg) |
| `--color-on-error` | `#ffffff` | Text on error |

**Brand gradient:** Defined as a utility class `.bg-brand-gradient` in `globals.css`
(NOT as an arbitrary Tailwind value). Add to `globals.css`:

```css
.bg-brand-gradient {
  background: linear-gradient(135deg, #4e644f 0%, #88a088 100%);
}
```

Used on primary CTA buttons and splash screen hero elements.

### 2.2 Typography

Loaded via `next/font/google` in `src/app/layout.tsx`, injected as CSS variables on
`<html>`.

| Role | Font | Weights | CSS Variable |
|---|---|---|---|
| Headlines | Plus Jakarta Sans | 700, 800 | `--font-headline` |
| Body & Labels | Be Vietnam Pro | 400, 500, 600 | `--font-body` |

Register in `@theme`:

```css
@theme {
  --font-headline: var(--font-plus-jakarta-sans), sans-serif;
  --font-body: var(--font-be-vietnam-pro), sans-serif;
}
```

This generates `font-headline` and `font-body` Tailwind utility classes.

### 2.3 Spacing & Shape

- **Border radius:** default `1rem` (16px), large `2rem` (32px), full `9999px`
- **Shadows:** soft, warm-tinted: `0 8px 24px rgba(27,28,27,0.04)` (cards),
  `0 4px 16px rgba(27,28,27,0.08)` (elevated), `0 -4px 24px rgba(27,28,27,0.04)` (nav)
- **Transitions:** `duration-200` standard, `active:scale-95` press feedback on
  all interactive elements

### 2.4 Icons

**Lucide React version ≥ 0.400.0** to ensure `WashingMachine` and `Bike` are
available. Install: `npm install lucide-react@latest`.

Replaces all emoji and unicode symbol hacks in the current codebase.

Icon mapping (Stitch Material Symbols → Lucide):

| Screen element | Lucide icon |
|---|---|
| Maid/Cleaning | `Sparkles` |
| Cook/Tiffin | `ChefHat` |
| Dhobi/Laundry | `WashingMachine` |
| Electrician/Plumber | `Zap` |
| Tutoring | `BookOpen` |
| Pickup/Drop | `Bike` |
| Home nav | `Home` |
| Bookings nav | `CalendarDays` |
| Favorites nav | `Heart` |
| Profile nav | `User` |
| Notifications | `Bell` |
| Location | `MapPin` |
| Star/Rating | `Star` |
| Verified | `BadgeCheck` |
| Arrow | `ChevronRight` |
| Back | `ArrowLeft` |
| Chat (in-page link) | `MessageCircle` |

---

## 3. Shared Component Library

All components live in `src/components/ui/`. They accept typed props,
use `cn()` (clsx + tailwind-merge) for class merging, and follow TypeScript strict.

### 3.0 cn() utility

```
src/lib/cn.ts
```

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### 3.1 Button

```
src/components/ui/Button.tsx
```

`'use client'` directive required (event handlers, loading state).

Props: `variant` (primary | secondary | ghost | destructive), `size` (sm | md | lg),
`loading` (boolean), `fullWidth` (boolean), plus all native `ButtonHTMLAttributes`.

- **primary:** `bg-brand-gradient text-on-primary shadow-[0_8px_24px_rgba(78,100,79,0.2)]`
- **secondary:** `bg-secondary-fixed text-secondary`
- **ghost:** `text-on-surface-variant border border-outline-variant hover:bg-surface-container`
- **destructive:** `bg-error text-on-error`
- **loading:** spinner SVG replaces children, `disabled` + `cursor-not-allowed`

### 3.2 Card

```
src/components/ui/Card.tsx
```

Server component (no interactivity needed). Props: `variant` (default | elevated | flat),
`className`, `children`.

- **default:** `bg-surface-container-lowest border border-outline-variant/10 shadow-[0_8px_24px_rgba(27,28,27,0.04)] rounded-2xl`
- **elevated:** stronger shadow `shadow-[0_4px_16px_rgba(27,28,27,0.08)]`
- **flat:** `bg-surface-container-lowest rounded-2xl` (no shadow, no border)

### 3.3 Badge

```
src/components/ui/Badge.tsx
```

Server component. Props: `variant` (verified | pending | active | confirmed |
in-progress | completed | cancelled | info).

Maps to visual styles:
- `verified`: `bg-primary-fixed text-on-primary-fixed`
- `pending`: `bg-amber-100 text-amber-800`
- `confirmed`: `bg-tertiary-fixed text-on-tertiary-container`
- `in-progress`: `bg-secondary-fixed text-secondary`
- `completed`: `bg-primary-fixed text-on-primary-fixed`
- `cancelled`: `bg-error-container text-error`
- `info`: `bg-surface-container text-on-surface-variant`

### 3.4 Input

```
src/components/ui/Input.tsx
```

`'use client'` directive required (onChange handlers).

Props: `label?: string`, `error?: string`, `hint?: string`, plus all native
`InputHTMLAttributes<HTMLInputElement>`.

Styled: `bg-surface-container border border-outline-variant rounded-xl px-4 py-3
focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none`.

### 3.5 ProviderCard

```
src/components/ui/ProviderCard.tsx
```

Server component. Props: `provider: ProviderListItem`, `href: string`.

Since real provider photos are deferred (Out of Scope), the "hero" area shows a
**colored avatar** (initials of provider name in a styled square) rather than an
`<img>` tag. Layout: avatar area (h-32, colored bg) → rating badge overlay
(top-right) → name + role + price → chevron link button. Min width 200px for
horizontal scroll. Hover: `hover:-translate-y-1 transition-transform`.

**Avatar color rule:** cycle through a fixed palette of 5 background colors based on
the first character of the provider's display name (deterministic, not random):
```ts
const AVATAR_COLORS = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-secondary',
  'bg-tertiary-fixed text-tertiary',
  'bg-error-container text-error',
  'bg-surface-container-high text-on-surface-variant',
]
const avatarColor = AVATAR_COLORS[
  provider.displayName.charCodeAt(0) % AVATAR_COLORS.length
]
```
Show the first two letters of `provider.displayName` as the initials (e.g., "La" for "Lakshmi").

### 3.6 CategoryCard

```
src/components/ui/CategoryCard.tsx
```

Server component. Props:
```ts
interface CategoryCardProps {
  slug: string
  name: string
  icon: React.ElementType  // Lucide icon component
  href: string
}
```

Color-per-category is defined in `src/lib/constants.ts` as a lookup map:
```ts
export const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  'maid-cleaning':      'bg-primary-fixed text-primary',
  'cook-tiffin':        'bg-secondary-fixed text-secondary',
  'dhobi-laundry':      'bg-tertiary-fixed text-tertiary',
  'electrician-plumber':'bg-error-container text-error',
  'tutoring':           'bg-[#cde5ff] text-[#073452]',
  'pickup-drop':        'bg-primary-fixed-dim text-on-primary-container',
}
```

Icon container: 48×48 rounded-2xl, color from map, Lucide icon at size 24.

### 3.7 PageHeader

```
src/components/ui/PageHeader.tsx
```

Server component (notification bell will link, not click-handle). Props:
```ts
interface PageHeaderProps {
  showLocation?: boolean
  showNotification?: boolean
  title?: string
}
```

When `showLocation` is true, shows "Hyderabad" as a hardcoded default location
(no geolocation API, no database field). This is a placeholder for a future
user-preference feature. Location text is purely cosmetic for now.

Fixed top bar: `fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md
h-16 shadow-[0_8px_24px_rgba(27,28,27,0.04)]`.

### 3.8 BottomNav (full rewrite of existing)

```
src/components/layout/BottomNav.tsx  (existing file — full rewrite)
```

**4 tabs** (intentionally reduced from current 5 — Browse and Chat are removed from nav):

| Tab | Icon | href |
|---|---|---|
| Home | `Home` | `/` |
| Bookings | `CalendarDays` | `/bookings` |
| Favorites | `Heart` | `/favorites` |
| Profile | `User` | `/provider/dashboard` |

**Why 4 tabs (not 5):**
- **Browse** is accessible from the Home screen category grid and the "See all"
  provider link. It does not need a dedicated nav tab.
- **Chat** is contextual to bookings (like WhatsApp / Uber). Users reach it via
  a "Message" button on booking cards (added in Batch 3). Removing it from the nav
  reduces cognitive load for new users who have no chats yet.

**Note on Profile tab:** Routes to `/provider/dashboard` for now (same as current nav).
A unified `/profile` page is deferred to post-MVP.

**`'use client'` required** — BottomNav uses `usePathname()` from `next/navigation`.

**Hidden on:** Use `pathname.startsWith('/login')`, `pathname.startsWith('/auth')`,
and `pathname === '/welcome'` (exact match — not startsWith, since no sub-routes exist).

Active tab: `bg-primary-fixed text-on-primary-fixed rounded-2xl px-5 py-1`.
Inactive: `text-on-surface-variant hover:text-on-surface`.
Bar: `fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/90
backdrop-blur-md rounded-t-[2rem] border-t border-outline-variant/15
shadow-[0_-4px_24px_rgba(27,28,27,0.04)] flex justify-around items-center
px-4 pt-2 pb-6`.

---

## 4. New & Updated Routes

### 4.1 New Route: /welcome

```
src/app/welcome/page.tsx
```

Server component. Auth check at top using the existing SSR Supabase client pattern:
```ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (user) redirect('/')
```

Layout:
- Background: two organic gradient blobs (CSS `::before`/`::after` absolute divs)
- Top section: `MapPin` icon (Lucide, 48px, `text-primary`) + "TownHelp" headline +
  tagline "Your neighborhood. Your trusted providers."
- Middle: asymmetric bento layout with two colored placeholder panels
  (no real images — use gradient fills from the design palette)
- Bottom CTA zone:
  - "I need services" → `<Link href="/login?role=requester">` (primary gradient button)
  - "I offer services" → `<Link href="/login?role=provider">` (secondary button)
  - "Sign in with email" → `<Link href="/login">` (text link)

### 4.2 Updated Route: /login

`src/app/login/page.tsx` and `src/app/login/LoginForm.tsx`:

**Routing changes in `LoginForm.tsx`:**
- Current code has `router.push('/')` hardcoded on lines ~77 and ~95 after
  successful sign-up and sign-in respectively. Both must be replaced with
  role-aware redirect logic.
- Read `role` from `useSearchParams()` at component mount. (`useSearchParams` is already
  imported in the existing `LoginForm.tsx` — no new import needed.)
- After successful auth + sync:
  - `role === 'provider'` → `router.push('/provider/dashboard')`
  - anything else (including `'requester'`, undefined, or any unknown value) → `router.push('/')`

**Visual changes:**
- Remove `min-h-screen bg-gray-50` wrapping div
- Replace with warm surface bg + organic blob textures matching welcome screen
- Form card: `Card` component (elevated variant), centered, max-w-sm

### 4.3 Updated Root Layout

`src/app/layout.tsx`:
- Add `next/font/google` imports for Plus Jakarta Sans (700, 800) and
  Be Vietnam Pro (400, 500, 600)
- Apply fonts as `variable` mode, inject on `<html>` className
- Update `<body>` className to `bg-surface text-on-surface font-body`
- Update main content padding-bottom from current `pb-16` to `pb-24`
  (intentional — redesigned BottomNav is taller due to rounded top corners
  and pb-6 safe-area padding)

---

## 5. Page Redesigns by Batch

### Batch 0 — Foundation (prerequisite for all batches)

Install dependencies first:
```bash
npm install lucide-react@latest clsx tailwind-merge
```

Files to create/update:
1. `src/app/globals.css` — `@theme {}` token block + `.bg-brand-gradient` class
2. `src/app/layout.tsx` — fonts, body classes, pb-24 on main
3. `src/lib/cn.ts` — `cn()` utility
4. `src/lib/constants.ts` — add `CATEGORY_COLOR_CLASSES` map (alongside existing `CATEGORY_ICONS`)
5. `src/components/ui/Button.tsx`
6. `src/components/ui/Card.tsx`
7. `src/components/ui/Badge.tsx`
8. `src/components/ui/Input.tsx`
9. `src/components/ui/ProviderCard.tsx`
10. `src/components/ui/CategoryCard.tsx`
11. `src/components/ui/PageHeader.tsx`
12. `src/components/layout/BottomNav.tsx` (full rewrite — 4 tabs, hide on /welcome)

### Batch 1 — Entry + Discovery

1. `src/app/welcome/page.tsx` — new splash screen (Server Component)
2. `src/app/login/page.tsx` + `LoginForm.tsx` — redesigned + role routing
3. `src/app/page.tsx` — home: greeting + CategoryCard bento grid + ProviderCard carousel
4. `src/app/browse/page.tsx` + `SearchFilters.tsx` + `BookButton.tsx`

### Batch 2 — Provider Side

1. `src/app/provider/[id]/page.tsx` + `FavoriteButton.tsx`
2. `src/app/provider/dashboard/page.tsx` — stats cards, services list
3. `src/app/provider/register/page.tsx`
4. `src/app/provider/add-service/page.tsx` + `AddServiceForm.tsx`
5. `src/app/provider/availability/page.tsx` + `AvailabilityForm.tsx`

### Batch 3 — Booking Flow

1. `src/app/bookings/page.tsx` — tabs (Upcoming/Past), booking cards with status badges
2. `src/app/bookings/_components/BookingActionButtons.tsx`
3. `src/app/bookings/_components/ReviewButton.tsx`
4. Add "Message" button to booking cards → links to `/chat/[conversationId]`
   (this is how Chat becomes reachable without a nav tab)

Note: `src/components/PaymentCheckout.tsx` already exists in the correct location —
no move needed.

### Batch 4 — Social + Utility

1. `src/app/chat/page.tsx` — conversation list
2. `src/app/chat/[conversationId]/page.tsx` + `ChatMessages.tsx`
3. `src/components/chat/MessageInput.tsx`
4. `src/app/favorites/page.tsx` + `UnfavoriteButton.tsx`
5. `src/app/notifications/page.tsx` + `_components/`
6. Empty states: friendly text + icon (no illustration library needed for MVP)

---

## 6. Technical Constraints

- **Tailwind v4:** Use plain `@theme {}` (NOT `@theme inline`) for token generation.
  Arbitrary hex values (`bg-[#4e644f]`) are forbidden in components — all colors
  go through token classes. Exception: `CATEGORY_COLOR_CLASSES` map may use
  arbitrary values for categories not covered by the base token set.
- **Brand gradient:** Always use `.bg-brand-gradient` CSS class, never inline style.
- **Server Components by default.** `'use client'` required on: BottomNav
  (uses `usePathname`), Button (event handlers + loading state), Input (onChange),
  LoginForm (form state + router), BookButton, BookingActionButtons, ReviewButton,
  MessageInput, ChatMessages, UnfavoriteButton, MarkAllReadButton.
- **No new backend actions** required for this redesign.
- **TypeScript strict.** All new component props explicitly typed.
- **Existing functionality preserved.**

---

## 7. Out of Scope

- Dark mode (deferred to post-MVP)
- Real provider photos — use colored avatar initials as placeholder
- Animations beyond CSS transitions (Framer Motion — deferred)
- Geolocation / user location preference — PageHeader shows "Hyderabad" as static text
- The `hearth_village`, `townhelp_neighborhood_services`, `requester_profile` Stitch
  screens (features not in current app)

---

## 8. Success Criteria

- [ ] All 13 existing pages render correctly with new design
- [ ] New `/welcome` splash routes to `/login?role=requester|provider` correctly
- [ ] `npx tsc --noEmit` passes after each batch
- [ ] `npm run build` succeeds
- [ ] BottomNav active state correct on all 4 tabs
- [ ] BottomNav hidden on `/login`, `/auth`, `/welcome`
- [ ] No emoji/unicode icon hacks remain — all replaced with Lucide
- [ ] All color tokens in `@theme {}` — no hardcoded hex in component classes
  (exception: `CATEGORY_COLOR_CLASSES` map in constants.ts)
- [ ] Brand gradient uses `.bg-brand-gradient` class, not inline style
- [ ] Mobile viewport (390px) looks correct in browser devtools
- [ ] Chat reachable via "Message" button on booking cards
