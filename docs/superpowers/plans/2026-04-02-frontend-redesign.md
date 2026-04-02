# TownHelp Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain gray-box UI with the warm, Indian-market design from the Stitch reference (19 screens), using a Material Design 3 palette, Plus Jakarta Sans + Be Vietnam Pro fonts, and Lucide React icons.

**Architecture:** CSS-first design tokens via Tailwind v4 `@theme {}` → shared UI primitives in `src/components/ui/` → page redesigns in 4 batches. Foundation (Batch 0) must complete before any page work begins. Batches 1–4 can each be committed independently.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Tailwind CSS v4 · Lucide React ≥ 0.400.0 · clsx · tailwind-merge · next/font/google

**Spec:** `docs/superpowers/specs/2026-04-02-frontend-redesign-design.md`

---

## File Map

### Created (new files)
| File | Purpose |
|---|---|
| `src/lib/cn.ts` | `cn()` utility (clsx + tailwind-merge) |
| `src/components/ui/Button.tsx` | Button with 4 variants + loading state |
| `src/components/ui/Card.tsx` | Card with 3 variants |
| `src/components/ui/Badge.tsx` | Status/role badges |
| `src/components/ui/Input.tsx` | Styled form input with label/error |
| `src/components/ui/ProviderCard.tsx` | Provider card with avatar + rating overlay |
| `src/components/ui/CategoryCard.tsx` | 2-col bento category tile |
| `src/components/ui/PageHeader.tsx` | Fixed frosted-glass top bar |
| `src/app/welcome/page.tsx` | New splash screen |

### Modified (existing files)
| File | Change |
|---|---|
| `src/app/globals.css` | Replace with M3 tokens + fonts + brand gradient |
| `src/app/layout.tsx` | Swap Geist → Plus Jakarta Sans + Be Vietnam Pro, pb-24 |
| `src/lib/constants.ts` | Add `CATEGORY_COLOR_CLASSES` + `CATEGORY_LUCIDE_ICONS` |
| `src/components/layout/BottomNav.tsx` | Full rewrite — 4 tabs, Lucide icons, pill active state |
| `src/app/login/page.tsx` | Update metadata |
| `src/app/login/LoginForm.tsx` | Role-aware redirect, visual redesign |
| `src/app/page.tsx` | Home redesign — greeting + category grid + provider carousel |
| `src/app/browse/page.tsx` | Browse redesign — category chips + provider cards |
| `src/app/browse/SearchFilters.tsx` | Styled search/area inputs |
| `src/app/browse/BookButton.tsx` | Styled book button |
| `src/app/provider/[id]/page.tsx` | Provider profile redesign |
| `src/app/provider/[id]/FavoriteButton.tsx` | Styled favorite toggle |
| `src/app/provider/dashboard/page.tsx` | Dashboard with stats cards |
| `src/app/provider/register/page.tsx` | Onboarding redesign |
| `src/app/provider/add-service/page.tsx` + `AddServiceForm.tsx` | Form redesign |
| `src/app/provider/availability/page.tsx` + `AvailabilityForm.tsx` | Schedule redesign |
| `src/app/bookings/page.tsx` | Bookings tabs + cards |
| `src/app/bookings/_components/BookingActionButtons.tsx` | Styled action buttons |
| `src/app/bookings/_components/ReviewButton.tsx` | Styled review button |
| `src/app/chat/page.tsx` | Chat list redesign |
| `src/app/chat/[conversationId]/page.tsx` | Chat view redesign |
| `src/app/chat/[conversationId]/ChatMessages.tsx` | Message bubbles |
| `src/components/chat/MessageInput.tsx` | Styled message input |
| `src/app/favorites/page.tsx` | Favorites redesign |
| `src/app/favorites/UnfavoriteButton.tsx` | Styled unfavorite |
| `src/app/notifications/page.tsx` | Notifications redesign |
| `src/app/notifications/_components/MarkAllReadButton.tsx` | Styled button |
| `src/app/notifications/_components/NotificationRow.tsx` | Notification row |

---

## ═══ BATCH 0 — FOUNDATION ═══
> Complete this entire batch before touching any page. All pages depend on these tokens and components.

---

### Task 1: Install dependencies

**Files:** `package.json` (modified automatically)

- [ ] **Step 1: Install packages**
```bash
npm install lucide-react@latest clsx tailwind-merge
```

- [ ] **Step 2: Verify installed**
```bash
node -e "require('lucide-react'); require('clsx'); require('tailwind-merge'); console.log('OK')"
```
Expected output: `OK`

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore(deps): add lucide-react, clsx, tailwind-merge"
```

---

### Task 2: Design tokens + brand gradient in globals.css

**Files:**
- Modify: `src/app/globals.css` (full replacement)

Current file uses `@theme inline` with Geist fonts and dark mode vars — replace entirely.

- [ ] **Step 1: Replace globals.css**

```css
@import "tailwindcss";

/* ─── M3 Color Tokens ─── */
/* @theme must be TOP-LEVEL — never inside @layer */
@theme {
  /* Primary — Forest Green */
  --color-primary: #4e644f;
  --color-primary-fixed: #d0e9ce;
  --color-primary-fixed-dim: #b4cdb3;
  --color-primary-container: #88a088;
  --color-on-primary: #ffffff;
  --color-on-primary-fixed: #0b200f;
  --color-on-primary-container: #223724;

  /* Secondary — Warm Brown */
  --color-secondary: #6a5c4e;
  --color-secondary-fixed: #f3dfce;
  --color-secondary-fixed-dim: #d6c3b3;
  --color-on-secondary: #ffffff;
  --color-on-secondary-fixed: #231a0f;
  --color-on-secondary-container: #706254;

  /* Tertiary — Steel Blue */
  --color-tertiary: #3d6282;
  --color-tertiary-fixed: #cde5ff;
  --color-tertiary-fixed-dim: #a6caef;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #073452;
  --color-on-tertiary-fixed: #001d32;
  --color-on-tertiary-fixed-variant: #244a69;

  /* Surface */
  --color-surface: #fbf9f7;
  --color-surface-bright: #fbf9f7;
  --color-surface-dim: #dbdad8;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f5f3f1;
  --color-surface-container: #efedec;
  --color-surface-container-high: #eae8e6;
  --color-surface-container-highest: #e4e2e0;
  --color-surface-variant: #e4e2e0;
  --color-surface-tint: #4e644f;
  --color-inverse-surface: #30302f;
  --color-inverse-on-surface: #f2f0ee;

  /* On-Surface */
  --color-on-surface: #1b1c1b;
  --color-on-surface-variant: #434842;
  --color-on-background: #1b1c1b;
  --color-background: #fbf9f7;

  /* Outline */
  --color-outline: #737971;
  --color-outline-variant: #c3c8c0;

  /* Error */
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-error: #ffffff;
  --color-on-error-container: #93000a;

  /* Inverse */
  --color-inverse-primary: #b4cdb3;

  /* Typography */
  --font-headline: var(--font-plus-jakarta-sans), sans-serif;
  --font-body: var(--font-be-vietnam-pro), sans-serif;
  --font-label: var(--font-be-vietnam-pro), sans-serif;
}

/* ─── Brand Gradient (use class .bg-brand-gradient, never inline style) ─── */
.bg-brand-gradient {
  background: linear-gradient(135deg, #4e644f 0%, #88a088 100%);
}

/* ─── Base ─── */
body {
  -webkit-tap-highlight-color: transparent;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

- [ ] **Step 2: Verify no build error**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no output (zero errors)

- [ ] **Step 3: Commit**
```bash
git add src/app/globals.css
git commit -m "feat(ui): add M3 design tokens and brand gradient to globals.css"
```

---

### Task 3: Fonts in layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from 'next/font/google'
import BottomNav from '@/components/layout/BottomNav'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
})

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TownHelp — Neighborhood Services',
  description: 'Find trusted local service providers in your neighborhood.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <main className="flex-1 pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/app/layout.tsx
git commit -m "feat(ui): swap Geist for Plus Jakarta Sans + Be Vietnam Pro fonts"
```

---

### Task 4: cn() utility

**Files:**
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Create the file**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/lib/cn.ts
git commit -m "chore(ui): add cn() utility for conditional class merging"
```

---

### Task 5: Update constants.ts with color classes and Lucide icon map

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Replace constants.ts**

```ts
import {
  Sparkles,
  ChefHat,
  WashingMachine,
  Zap,
  BookOpen,
  Bike,
  type LucideIcon,
} from 'lucide-react'

// Legacy emoji icons (kept for any code that still uses them during migration)
export const CATEGORY_ICONS: Record<string, string> = {
  'maid-cleaning': '🧹',
  'cook-tiffin': '👨‍🍳',
  'electrician-plumber': '🔧',
  'dhobi-laundry': '👕',
  'tutoring': '📚',
  'pickup-drop': '🚗',
}

// Lucide icon components per category slug
export const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  'maid-cleaning': Sparkles,
  'cook-tiffin': ChefHat,
  'dhobi-laundry': WashingMachine,
  'electrician-plumber': Zap,
  'tutoring': BookOpen,
  'pickup-drop': Bike,
}

// Tailwind color classes for each category icon container
// Used by CategoryCard component
export const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  'maid-cleaning': 'bg-primary-fixed text-primary',
  'cook-tiffin': 'bg-secondary-fixed text-secondary',
  'dhobi-laundry': 'bg-tertiary-fixed text-tertiary',
  'electrician-plumber': 'bg-error-container text-error',
  'tutoring': 'bg-[#cde5ff] text-[#073452]',
  'pickup-drop': 'bg-primary-fixed-dim text-on-primary-container',
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/lib/constants.ts
git commit -m "feat(ui): add Lucide icon map and M3 color classes to constants"
```

---

### Task 6: Button component

**Files:**
- Create: `src/components/ui/Button.tsx`

- [ ] **Step 1: Create Button.tsx**

```tsx
'use client'

import { cn } from '@/lib/cn'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-gradient text-on-primary shadow-[0_8px_24px_rgba(78,100,79,0.2)] hover:opacity-90',
  secondary:
    'bg-secondary-fixed text-secondary hover:bg-secondary-fixed-dim',
  ghost:
    'bg-transparent text-on-surface-variant border border-outline-variant hover:bg-surface-container',
  destructive:
    'bg-error text-on-error hover:opacity-90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm rounded-xl',
  md: 'h-12 px-6 text-sm rounded-xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-headline font-bold',
        'transition-all duration-200 active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/Button.tsx
git commit -m "feat(ui): add Button component with 4 variants and loading state"
```

---

### Task 7: Card component

**Files:**
- Create: `src/components/ui/Card.tsx`

- [ ] **Step 1: Create Card.tsx**

```tsx
import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'elevated' | 'flat'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'bg-surface-container-lowest border border-outline-variant/10 shadow-[0_8px_24px_rgba(27,28,27,0.04)]',
  elevated:
    'bg-surface-container-lowest shadow-[0_4px_16px_rgba(27,28,27,0.08)]',
  flat:
    'bg-surface-container-lowest',
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/Card.tsx
git commit -m "feat(ui): add Card component with 3 variants"
```

---

### Task 8: Badge component

**Files:**
- Create: `src/components/ui/Badge.tsx`

- [ ] **Step 1: Create Badge.tsx**

```tsx
import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

type BadgeVariant =
  | 'verified'
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'info'
  | 'active'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  verified:    'bg-primary-fixed text-on-primary-fixed',
  pending:     'bg-amber-100 text-amber-800',
  confirmed:   'bg-tertiary-fixed text-on-tertiary-container',
  'in-progress': 'bg-secondary-fixed text-secondary',
  completed:   'bg-primary-fixed text-on-primary-fixed',
  cancelled:   'bg-error-container text-error',
  info:        'bg-surface-container text-on-surface-variant',
  active:      'bg-primary-fixed text-on-primary-fixed',
}

export function Badge({ variant = 'info', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/Badge.tsx
git commit -m "feat(ui): add Badge component for booking status and verified states"
```

---

### Task 9: Input component

**Files:**
- Create: `src/components/ui/Input.tsx`

- [ ] **Step 1: Create Input.tsx**

```tsx
'use client'

import { cn } from '@/lib/cn'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full bg-surface-container border border-outline-variant rounded-xl',
          'px-4 py-3 text-on-surface placeholder:text-outline',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          error && 'border-error focus:border-error focus:ring-error/20',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-error font-medium">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-outline">{hint}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/Input.tsx
git commit -m "feat(ui): add Input component with label, error, hint states"
```

---

### Task 10: ProviderCard component

**Files:**
- Create: `src/components/ui/ProviderCard.tsx`

- [ ] **Step 1: Create ProviderCard.tsx**

```tsx
import { cn } from '@/lib/cn'
import { Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ProviderListItem } from '@/types'

// Deterministic avatar color — cycles through 5 palette colors based on first char
const AVATAR_COLORS = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-secondary',
  'bg-tertiary-fixed text-tertiary',
  'bg-error-container text-error',
  'bg-surface-container-high text-on-surface-variant',
]

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

interface ProviderCardProps {
  provider: ProviderListItem
  href: string
  className?: string
}

export function ProviderCard({ provider, href, className }: ProviderCardProps) {
  const avatarColor = getAvatarColor(provider.displayName)
  const initials = getInitials(provider.displayName)
  const primaryService = provider.services?.[0]

  return (
    <Link
      href={href}
      className={cn(
        'min-w-[200px] bg-surface-container-lowest rounded-2xl overflow-hidden',
        'shadow-[0_8px_24px_rgba(27,28,27,0.04)] border border-outline-variant/10',
        'transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]',
        'block',
        className,
      )}
    >
      {/* Avatar hero area */}
      <div className={cn('h-32 w-full relative flex items-center justify-center', avatarColor)}>
        <span className="font-headline text-4xl font-extrabold opacity-80">
          {initials}
        </span>
        {/* Rating badge overlay */}
        <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold text-on-surface">
            {provider.ratingAvg.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-headline font-bold text-on-surface mb-0.5">
          {provider.displayName}
        </h3>
        <p className="text-xs text-on-surface-variant mb-3">
          {primaryService?.category?.name ?? 'Service Provider'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary">
            Starts at ₹{provider.baseRate}
          </span>
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-on-primary-fixed" />
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/ProviderCard.tsx
git commit -m "feat(ui): add ProviderCard with avatar initials and rating overlay"
```

---

### Task 11: CategoryCard component

**Files:**
- Create: `src/components/ui/CategoryCard.tsx`

- [ ] **Step 1: Create CategoryCard.tsx**

```tsx
import { cn } from '@/lib/cn'
import Link from 'next/link'
import { CATEGORY_COLOR_CLASSES } from '@/lib/constants'
import type { LucideIcon } from 'lucide-react'

interface CategoryCardProps {
  slug: string
  name: string
  icon: LucideIcon
  href: string
  className?: string
}

export function CategoryCard({ slug, name, icon: Icon, href, className }: CategoryCardProps) {
  const colorClass = CATEGORY_COLOR_CLASSES[slug] ?? 'bg-surface-container text-on-surface-variant'

  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-start p-5 bg-surface-container-lowest rounded-2xl',
        'border border-outline-variant/10 text-left',
        'transition-all duration-300 active:scale-95 hover:shadow-md',
        className,
      )}
    >
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', colorClass)}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="font-headline font-bold text-on-surface-variant text-sm leading-tight">
        {name}
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/CategoryCard.tsx
git commit -m "feat(ui): add CategoryCard for bento grid category navigation"
```

---

### Task 12: PageHeader component

**Files:**
- Create: `src/components/ui/PageHeader.tsx`

- [ ] **Step 1: Create PageHeader.tsx**

```tsx
import { Bell, MapPin, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title?: string
  showLocation?: boolean
  showNotification?: boolean
  className?: string
}

export function PageHeader({
  title,
  showLocation = false,
  showNotification = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 w-full z-50 h-16',
        'bg-surface/80 backdrop-blur-md',
        'shadow-[0_8px_24px_rgba(27,28,27,0.04)]',
        'border-b border-outline-variant/10',
        className,
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: location chip or page title */}
        <div>
          {showLocation ? (
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-outline font-bold">
                Location
              </span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="font-headline text-lg font-bold text-primary">
                  Hyderabad
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          ) : (
            <h1 className="font-headline text-lg font-bold text-on-surface">
              {title}
            </h1>
          )}
        </div>

        {/* Right: notification bell */}
        {showNotification && (
          <Link href="/notifications" className="relative p-2 rounded-full hover:bg-surface-container transition-colors">
            <Bell className="w-5 h-5 text-primary" />
            {/* Unread dot — always shown; future: pass unreadCount prop */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface" />
          </Link>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/PageHeader.tsx
git commit -m "feat(ui): add PageHeader with frosted glass, location, notification bell"
```

---

### Task 13: Rewrite BottomNav

**Files:**
- Modify: `src/components/layout/BottomNav.tsx` (full rewrite)

- [ ] **Step 1: Rewrite BottomNav.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Heart, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',     href: '/',                  icon: Home },
  { label: 'Bookings', href: '/bookings',           icon: CalendarDays },
  { label: 'Favorites',href: '/favorites',          icon: Heart },
  { label: 'Profile',  href: '/provider/dashboard', icon: User },
]

function isHidden(pathname: string): boolean {
  return (
    pathname === '/welcome' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth')
  )
}

export default function BottomNav() {
  const pathname = usePathname()

  if (isHidden(pathname)) return null

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-surface-container-lowest/90 backdrop-blur-md',
        'rounded-t-[2rem] border-t border-outline-variant/15',
        'shadow-[0_-4px_24px_rgba(27,28,27,0.04)]',
        'flex justify-around items-center px-4 pt-2 pb-6',
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5',
              'transition-all duration-200 active:scale-90',
              isActive
                ? 'bg-primary-fixed text-on-primary-fixed rounded-2xl px-5 py-1'
                : 'text-on-surface-variant hover:text-on-surface px-3 py-1',
            )}
          >
            <item.icon
              className="w-5 h-5"
              style={isActive ? { fill: 'currentColor' } : undefined}
            />
            <span className="font-body text-[11px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Start dev server and visually verify BottomNav at 390px**
```bash
# Server should already be running at localhost:3000
# Open browser devtools → mobile emulation → 390px width
# Verify: 4 tabs visible, active pill on current tab, hidden on /login
```

- [ ] **Step 4: Commit**
```bash
git add src/components/layout/BottomNav.tsx
git commit -m "feat(ui): rewrite BottomNav — 4 tabs, pill active state, Lucide icons"
```

---

## ═══ BATCH 1 — ENTRY + DISCOVERY ═══

---

### Task 14: /welcome splash screen

**Files:**
- Create: `src/app/welcome/page.tsx`

- [ ] **Step 1: Create welcome/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default async function WelcomePage() {
  // Already logged-in users skip the splash
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  return (
    <main className="relative min-h-screen max-w-[390px] mx-auto flex flex-col items-center justify-between overflow-hidden px-6 py-12">
      {/* Organic background blobs */}
      <div className="absolute top-[-10%] right-[-20%] w-[280px] h-[280px] bg-secondary-fixed/40 blur-3xl rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-15%] w-[240px] h-[240px] bg-primary-fixed/30 blur-3xl rounded-full -z-10 pointer-events-none" />

      {/* Brand section */}
      <section className="flex flex-col items-center text-center mt-8">
        <div className="w-20 h-20 mb-6 bg-surface-container-lowest shadow-[0_8px_24px_rgba(27,28,27,0.06)] rounded-2xl flex items-center justify-center">
          <MapPin className="w-10 h-10 text-primary fill-primary/20" />
        </div>
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-3">
          TownHelp
        </h1>
        <p className="font-body text-on-surface-variant text-lg leading-relaxed max-w-[280px]">
          Your neighborhood. Your trusted providers.
        </p>
      </section>

      {/* Hero bento — colored gradient placeholder panels (no emoji per spec) */}
      <section className="w-full flex gap-3 h-48 my-8">
        <div className="flex-1 rounded-2xl bg-gradient-to-br from-primary-fixed to-primary-fixed-dim" />
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex-[1.5] rounded-2xl bg-gradient-to-br from-secondary-fixed to-secondary-fixed-dim" />
          <div className="flex-1 rounded-2xl bg-primary-fixed" />
        </div>
      </section>

      {/* CTA zone */}
      <section className="w-full flex flex-col gap-4 pb-4">
        <Link href="/login?role=requester" className="block w-full">
          <Button variant="primary" size="lg" fullWidth>
            I need services
          </Button>
        </Link>
        <Link href="/login?role=provider" className="block w-full">
          <Button variant="secondary" size="lg" fullWidth>
            I offer services
          </Button>
        </Link>
        <Link
          href="/login"
          className="text-center text-sm text-on-surface-variant font-medium hover:text-primary transition-colors mt-2 flex items-center justify-center gap-1"
        >
          Sign in with email →
        </Link>
        <p className="text-[10px] text-outline text-center px-4 mt-2">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Built with love in your community.
        </p>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Visual check**
Open `http://localhost:3000/welcome` (log out first if needed). Verify:
- Organic blobs visible
- TownHelp logo + tagline
- Two CTA buttons
- BottomNav hidden ✓

- [ ] **Step 4: Commit**
```bash
git add src/app/welcome/
git commit -m "feat(ui): add /welcome splash screen with role-split CTAs"
```

---

### Task 15: /login redesign + role-aware redirect

**Files:**
- Modify: `src/app/login/LoginForm.tsx`
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Update LoginForm.tsx — role-aware redirect**

In `LoginForm.tsx`, find the two `router.push('/')` calls (after sign-up success ~line 77, after sign-in success ~line 95) and replace both with role-aware redirect logic. Also update visual styling.

Replace the entire file:

```tsx
'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { syncUserOnLogin } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function getFriendlyError(message: string): string {
  if (message.includes('rate limit')) return 'Too many attempts. Please wait a few minutes and try again.'
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password. Please try again.'
  if (message.includes('User already registered')) return 'An account with this email already exists. Try signing in instead.'
  if (message.includes('Password should be at least')) return 'Password must be at least 6 characters.'
  if (message.includes('invalid')) return 'Please check your email address and try again.'
  if (message.includes('network') || message.includes('fetch')) return 'Connection error. Please check your internet and try again.'
  return 'Something went wrong. Please try again.'
}

type FormState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'verify'; email: string }
  | { kind: 'resent' }

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [formState, setFormState] = useState<FormState>({ kind: 'idle' })
  const searchParams = useSearchParams()
  const router = useRouter()

  const role = searchParams.get('role')
  const authError = searchParams.get('error')
  const isLoading = formState.kind === 'loading'

  // Role-aware redirect: provider → dashboard, everything else → home
  function getRedirectPath(): string {
    return role === 'provider' ? '/provider/dashboard' : '/'
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setFormState({ kind: 'loading' })
    const trimmedEmail = email.trim().toLowerCase()

    if (isNewUser) {
      const trimmedName = fullName.trim()
      if (trimmedName.length < 2) {
        setFormState({ kind: 'error', message: 'Please enter your full name (at least 2 characters).' })
        return
      }
      const { data, error } = await authService.signUp(trimmedEmail, password, trimmedName)
      if (error) {
        setFormState({ kind: 'error', message: getFriendlyError(error.message) })
      } else if (data.user && !data.session) {
        setFormState({ kind: 'verify', email: trimmedEmail })
      } else if (data.session) {
        const syncResult = await syncUserOnLogin()
        if (!syncResult.success) {
          setFormState({ kind: 'error', message: 'Account created but setup failed. Please try signing in again.' })
          return
        }
        router.push(getRedirectPath())
      }
    } else {
      const { data, error } = await authService.signIn(trimmedEmail, password)
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setFormState({ kind: 'verify', email: trimmedEmail })
        } else {
          setFormState({ kind: 'error', message: getFriendlyError(error.message) })
        }
      } else if (data.session) {
        const syncResult = await syncUserOnLogin()
        if (!syncResult.success) {
          setFormState({ kind: 'error', message: 'Sign in succeeded but account sync failed. Please try again.' })
          return
        }
        router.push(getRedirectPath())
      }
    }
  }

  async function handleResendVerification(): Promise<void> {
    if (formState.kind !== 'verify') return
    setFormState({ kind: 'loading' })
    const { error } = await authService.resendVerificationEmail(formState.email)
    if (error) {
      setFormState({ kind: 'error', message: getFriendlyError(error.message) })
    } else {
      setFormState({ kind: 'resent' })
    }
  }

  if (formState.kind === 'verify') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-primary-fixed/40 border border-primary-fixed text-center">
          <div className="text-3xl mb-3">✉️</div>
          <h2 className="font-headline text-lg font-bold text-on-primary-fixed">Verify your email</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            We sent a verification link to <strong>{formState.email}</strong>.
          </p>
        </div>
        <div className="text-center space-y-3">
          <p className="text-sm text-on-surface-variant">Didn&apos;t receive the email?</p>
          <button type="button" onClick={handleResendVerification} className="text-sm font-medium text-primary hover:underline">
            Resend verification email
          </button>
        </div>
        <button type="button" onClick={() => setFormState({ kind: 'idle' })} className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
          ← Back to sign in
        </button>
      </div>
    )
  }

  if (formState.kind === 'resent') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-primary-fixed/40 border border-primary-fixed text-center">
          <div className="text-3xl mb-3">✓</div>
          <h2 className="font-headline text-lg font-bold text-on-surface">Email resent</h2>
          <p className="mt-2 text-sm text-on-surface-variant">A new verification link has been sent.</p>
        </div>
        <button type="button" onClick={() => setFormState({ kind: 'idle' })} className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
          ← Back to sign in
        </button>
      </div>
    )
  }

  return (
    <>
      {authError && formState.kind === 'idle' && (
        <div className="p-4 rounded-xl text-sm text-center bg-error-container text-error border border-error/20">
          {authError === 'auth_failed' ? 'Sign in failed. The link may have expired — please try again.' : 'Something went wrong. Please try again.'}
        </div>
      )}

      {/* Sign In / Sign Up toggle */}
      <div className="flex bg-surface-container rounded-xl p-1">
        <button
          type="button"
          onClick={() => { setIsNewUser(false); setFormState({ kind: 'idle' }) }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isNewUser ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsNewUser(true); setFormState({ kind: 'idle' }) }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isNewUser ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isNewUser && (
          <Input label="Full Name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required minLength={2} />
        )}
        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isNewUser ? 'At least 6 characters' : 'Enter your password'}
          required
          minLength={6}
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
          {isNewUser ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      {formState.kind === 'error' && (
        <div className="p-4 rounded-xl text-sm text-center bg-error-container text-error border border-error/20">
          {formState.message}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Update login/page.tsx visual wrapper**

```tsx
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <main className="relative min-h-screen max-w-[390px] mx-auto flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-20%] w-[280px] h-[280px] bg-secondary-fixed/30 blur-3xl rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-15%] w-[240px] h-[240px] bg-primary-fixed/20 blur-3xl rounded-full -z-10 pointer-events-none" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl font-extrabold text-primary mb-1">TownHelp</h1>
          <p className="text-sm text-on-surface-variant">Find trusted local services</p>
        </div>

        {/* Form card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_16px_rgba(27,28,27,0.08)] p-6 space-y-4 border border-outline-variant/10">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-outline mt-6">
          Secure sign-in · TownHelp v1.0
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Test role routing**
Visit `http://localhost:3000/login?role=provider` — after sign in, should redirect to `/provider/dashboard`. Visit `http://localhost:3000/login?role=requester` — should redirect to `/`.

- [ ] **Step 5: Commit**
```bash
git add src/app/login/
git commit -m "feat(ui): redesign login page + add role-aware post-auth redirect"
```

---

### Task 16: Home page redesign

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyProviderProfile, getProviders, getServiceCategories } from '@/app/actions/booking'
import { PageHeader } from '@/components/ui/PageHeader'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { ProviderCard } from '@/components/ui/ProviderCard'
import { CATEGORY_LUCIDE_ICONS } from '@/lib/constants'
import type { ServiceCategoryItem, ProviderListItem } from '@/types'
import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', user.id)
    .single()

  const [categories, popularProviders] = await Promise.all([
    getServiceCategories(),
    getProviders({ limit: 6 } as Parameters<typeof getProviders>[0]),
  ])

  const displayName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  return (
    <>
      <PageHeader showLocation showNotification />

      <div className="pt-20 pb-4 px-6 max-w-[390px] mx-auto">
        {/* Greeting */}
        <section className="mb-8 mt-2">
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
            Hi {displayName},<br />
            <span className="text-primary">what do you need today?</span>
          </h1>
        </section>

        {/* Category bento grid */}
        <section className="mb-10">
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat: ServiceCategoryItem) => {
              const Icon = CATEGORY_LUCIDE_ICONS[cat.slug]
              if (!Icon) return null
              return (
                <CategoryCard
                  key={cat.slug}
                  slug={cat.slug}
                  name={cat.name}
                  icon={Icon}
                  href={`/browse?category=${cat.slug}`}
                />
              )
            })}
          </div>
        </section>

        {/* Popular providers carousel */}
        {popularProviders && popularProviders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Popular in your area
              </h2>
              <Link href="/browse" className="text-primary font-bold text-sm hover:underline">
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
              {popularProviders.map((provider: ProviderListItem) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  href={`/provider/${provider.id}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sign out (tucked away) */}
        <div className="mt-8 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Check getProviders signature before using limit**

```bash
grep -n "getProviders" src/app/actions/booking.ts | head -10
```

Open `src/app/actions/booking.ts` and read the `getProviders` function signature. If it accepts `{ limit?: number }` or similar, keep the call as `getProviders({ limit: 6 })`. If it does NOT accept `limit`, replace the call with just `getProviders({})` or `getProviders()` (matching actual signature) — the home screen will show all providers, which is fine for MVP. Do NOT use the type cast `as Parameters<typeof getProviders>[0]` as it suppresses type errors silently.

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Visual check at 390px**
Visit `http://localhost:3000` (logged in). Verify:
- PageHeader shows at top with location "Hyderabad" and bell icon
- Greeting with user's first name
- 2×3 category bento grid with colored icons
- Horizontal provider carousel below
- BottomNav at bottom with Home tab active

- [ ] **Step 5: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat(ui): redesign home — greeting, category grid, provider carousel"
```

---

### Task 17: /browse redesign

**Files:**
- Modify: `src/app/browse/page.tsx`
- Modify: `src/app/browse/SearchFilters.tsx`
- Modify: `src/app/browse/BookButton.tsx`

- [ ] **Step 1: Update browse/page.tsx**

Replace the outer wrapper to use `PageHeader` + token classes:
- Replace `min-h-screen bg-gray-50 py-8 px-4` with `pt-20 pb-4 px-4 max-w-2xl mx-auto`
- Add `<PageHeader title="Find Providers" />` at top (outside the div)
- Replace `bg-white rounded-xl border border-gray-200` cards with `Card` component (`variant="default"`)
- Replace inline blue colors with token classes: `text-primary`, `bg-primary`, etc.
- Replace emoji in category chips with category name only (chips are text, not CategoryCard)
- Provider cards in the list: replace the existing card markup with `ProviderCard` component
- The "No providers found" empty state: add a `MapPin` Lucide icon and keep the existing text

- [ ] **Step 2: Update SearchFilters.tsx**
Replace bare `<input>` elements with `Input` component from `@/components/ui/Input`.
Replace any `bg-white border border-gray-*` with token equivalents.

- [ ] **Step 3: Update BookButton.tsx**
Replace the existing button classes with `Button` component (`variant="primary"`) from `@/components/ui/Button`.

- [ ] **Step 4: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**
```bash
git add src/app/browse/
git commit -m "feat(ui): redesign /browse with token classes and shared components"
```

---

## ═══ BATCH 2 — PROVIDER SIDE ═══

---

### Task 18: Provider profile /provider/[id]

**Files:**
- Modify: `src/app/provider/[id]/page.tsx`
- Modify: `src/app/provider/[id]/FavoriteButton.tsx`
- Modify: `src/app/provider/[id]/loading.tsx`

**Pattern to follow for all Batch 2 pages:**
1. Add `<PageHeader title="..." />` at top (outside main container)
2. Add `pt-20` to the main wrapper div
3. Replace `bg-gray-50` → `bg-surface`, `bg-white` → `bg-surface-container-lowest`
4. Replace `border-gray-200` → `border-outline-variant/20`
5. Replace `text-gray-*` colors with `text-on-surface`, `text-on-surface-variant`, `text-outline`
6. Replace `bg-blue-600` / `text-blue-*` → `bg-primary` / `text-primary`
7. Replace `rounded-xl` → `rounded-2xl`
8. Replace plain `<button>` with `Button` component
9. Use `Badge` component for verified/pending status
10. Use `Card` component for white card sections
11. Replace `text-sm text-blue-600 hover:underline` back links with `ArrowLeft` Lucide icon

- [ ] **Step 1: Apply pattern to provider/[id]/page.tsx**
- [ ] **Step 2: Apply pattern to FavoriteButton.tsx** (replace Heart emoji → `Heart` Lucide icon, use `Button variant="ghost"`)
- [ ] **Step 3: Update loading.tsx** — replace with skeleton using token bg classes
- [ ] **Step 4: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
- [ ] **Step 5: Commit**
```bash
git add src/app/provider/\[id\]/
git commit -m "feat(ui): redesign provider profile page"
```

---

### Task 19: Provider dashboard

**Files:**
- Modify: `src/app/provider/dashboard/page.tsx`

- [ ] **Step 1: Apply the Batch 2 pattern** (see Task 18 pattern above)
- Additionally: wrap each stats section in `Card variant="default"` components
- Use `Badge` for verified/pending status (replace the existing span)
- Use `Button variant="ghost"` for "Availability Settings" link
- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
- [ ] **Step 3: Commit**
```bash
git add src/app/provider/dashboard/
git commit -m "feat(ui): redesign provider dashboard with Card and Badge components"
```

---

### Task 20: Provider onboarding pages

**Files:**
- Modify: `src/app/provider/register/page.tsx`
- Modify: `src/app/provider/add-service/page.tsx`
- Modify: `src/app/provider/add-service/AddServiceForm.tsx`
- Modify: `src/app/provider/availability/page.tsx`
- Modify: `src/app/provider/availability/AvailabilityForm.tsx`

- [ ] **Step 1: Apply Batch 2 pattern to all 5 files**
- For form pages: replace bare `<input>`, `<select>`, `<textarea>` with `Input` component or token-styled equivalents
- Replace `<button type="submit">` with `Button variant="primary" size="lg" fullWidth`
- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```
- [ ] **Step 3: Commit**
```bash
git add src/app/provider/register/ src/app/provider/add-service/ src/app/provider/availability/
git commit -m "feat(ui): redesign provider onboarding and settings pages"
```

---

## ═══ BATCH 3 — BOOKING FLOW ═══

---

### Task 21: /bookings redesign + Message button for Chat access

**Files:**
- Modify: `src/app/bookings/page.tsx`
- Modify: `src/app/bookings/_components/BookingActionButtons.tsx`
- Modify: `src/app/bookings/_components/ReviewButton.tsx`
- Modify: `src/app/bookings/loading.tsx`

- [ ] **Step 1: Apply Batch 2 pattern to bookings/page.tsx**
- Add `<PageHeader title="My Bookings" />` + `pt-20`
- Replace `bg-gray-50` / `bg-white` / `border-gray-200` with token classes
- Use `Card variant="default"` for booking cards
- Use `Badge` for booking status display — map `BookingStatus` enum values:
  - `PENDING` → `variant="pending"`, `CONFIRMED` → `variant="confirmed"`,
  - `IN_PROGRESS` → `variant="in-progress"`, `COMPLETED` → `variant="completed"`,
  - `CANCELLED` → `variant="cancelled"`

- [ ] **Step 2: Check booking types for conversationId before adding Message button**

```bash
grep -n "conversationId\|conversation" src/types/index.ts
```

Read the `BookingAsRequester` and `BookingAsProvider` interfaces in `src/types/index.ts`.

**If `conversationId` exists on the type:** use `href={'/chat/' + booking.conversationId}` — this links directly to the correct chat thread.

**If `conversationId` does NOT exist:** use `href="/chat"` — this links to the chat list. The user lands on the full list and can find their conversation there. This is acceptable for MVP; add a `// TODO: link directly to booking conversation` comment.

Then add the Message button inside the booking card actions area:

```tsx
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

// href value determined by check above — either '/chat/[id]' or '/chat'
<Link
  href={chatHref}
  className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
>
  <MessageCircle className="w-4 h-4" />
  Message
</Link>
```

- [ ] **Step 3: Update BookingActionButtons.tsx**
Replace existing button styles with `Button` component (destructive for cancel/dispute, primary for confirm/start/complete).

- [ ] **Step 4: Update ReviewButton.tsx**
Replace button with `Button variant="secondary"`.

- [ ] **Step 5: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**
```bash
git add src/app/bookings/
git commit -m "feat(ui): redesign bookings page + add Message button for chat access"
```

---

## ═══ BATCH 4 — SOCIAL + UTILITY ═══

---

### Task 22: Chat pages

**Files:**
- Modify: `src/app/chat/page.tsx`
- Modify: `src/app/chat/[conversationId]/page.tsx`
- Modify: `src/app/chat/[conversationId]/ChatMessages.tsx`
- Modify: `src/components/chat/MessageInput.tsx`

- [ ] **Step 1: Apply Batch 2 pattern to chat/page.tsx**
- Add `<PageHeader title="Messages" />` + `pt-20`
- Replace card styles with token classes
- Each conversation row: use `Card variant="flat"` with hover state

- [ ] **Step 2: Apply pattern to chat/[conversationId]/page.tsx**
- Add `<PageHeader title={otherPartyName} />` + `pt-20`
- Chat bubbles: sent = `bg-primary text-on-primary rounded-2xl rounded-br-sm`, received = `bg-surface-container rounded-2xl rounded-bl-sm`

- [ ] **Step 3: Update MessageInput.tsx**
Replace textarea/button with token-styled equivalent. Use `Button variant="primary"` for send button with `Send` Lucide icon.

- [ ] **Step 4: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**
```bash
git add src/app/chat/ src/components/chat/
git commit -m "feat(ui): redesign chat pages with token classes and styled message input"
```

---

### Task 23: Favorites, Notifications, empty states

**Files:**
- Modify: `src/app/favorites/page.tsx`
- Modify: `src/app/favorites/UnfavoriteButton.tsx`
- Modify: `src/app/notifications/page.tsx`
- Modify: `src/app/notifications/_components/MarkAllReadButton.tsx`
- Modify: `src/app/notifications/_components/NotificationRow.tsx`

- [ ] **Step 1: Apply Batch 2 pattern to favorites/page.tsx**
- Add `<PageHeader title="Favourites" />` + `pt-20`
- Empty state: add `Heart` Lucide icon (size 48, `text-outline/50`), keep existing message text

- [ ] **Step 2: Update UnfavoriteButton.tsx**
Replace with `Button variant="ghost"` using `HeartOff` Lucide icon.

- [ ] **Step 3: Apply pattern to notifications/page.tsx**
- Add `<PageHeader title="Notifications" showNotification />` + `pt-20`
- Empty state: add `Bell` Lucide icon

- [ ] **Step 4: Update notification components**
- `MarkAllReadButton`: use `Button variant="ghost" size="sm"`
- `NotificationRow`: use token classes, add a colored dot indicator for unread

- [ ] **Step 5: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**
```bash
git add src/app/favorites/ src/app/notifications/
git commit -m "feat(ui): redesign favorites and notifications with token classes and empty states"
```

---

### Task 24: SignOutButton + final polish

**Files:**
- Modify: `src/components/SignOutButton.tsx`

- [ ] **Step 1: Update SignOutButton.tsx**
Replace existing button with `Button variant="ghost" size="sm"` using `LogOut` Lucide icon.

```tsx
'use client'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()
  async function handleSignOut() {
    await authService.signOut()
    router.push('/welcome')
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut}>
      <LogOut className="w-4 h-4 mr-1.5" />
      Sign out
    </Button>
  )
}
```

- [ ] **Step 2: Final TypeScript check — all files**
```bash
npx tsc --noEmit 2>&1
```
Expected: zero errors

- [ ] **Step 3: Final build check**
```bash
npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Visual check at 390px — full walkthrough**
Navigate through every page and verify:
- BottomNav visible everywhere except `/login`, `/auth`, `/welcome`
- Active tab pill correct on each page
- No emoji icons remaining in nav or category cards
- Consistent warm surface background throughout
- No hardcoded gray colors (`bg-gray-50`, `border-gray-200`, etc.)

- [ ] **Step 5: Final commit**
```bash
git add src/components/SignOutButton.tsx
git commit -m "feat(ui): update SignOutButton + post-signout redirect to /welcome"
```

---

## Verification Checklist

Run after all batches complete:

```bash
npx tsc --noEmit        # Must pass with zero errors
npm run build           # Must compile successfully
```

Browser checks at 390px (Chrome devtools → mobile emulation):
- [ ] `/welcome` — splash, two CTAs, no nav
- [ ] `/login` — warm bg, blobs, form card, no nav
- [ ] `/login?role=provider` — after auth → `/provider/dashboard`
- [ ] `/` — greeting, 2×3 category grid, provider carousel, Home tab active
- [ ] `/browse` — category chips, provider cards with avatars
- [ ] `/provider/[id]` — profile with avatar, services, rate
- [ ] `/provider/dashboard` — stats cards, services list
- [ ] `/bookings` — tabs, booking cards with status badges, Message button
- [ ] `/chat` — conversation list
- [ ] `/favorites` — list or empty state with Heart icon
- [ ] `/notifications` — list or empty state with Bell icon
- [ ] BottomNav hidden on: `/welcome`, `/login`, `/auth/*`
- [ ] No emoji icons in nav, categories, or action buttons
