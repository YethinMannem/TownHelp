---
name: building-components
description: >
  Creates React components and pages for TownHelp's mobile-first PWA.
  Activates when building UI components, implementing pages, styling
  with Tailwind, or working on frontend features. Triggers on
  "component", "page", "UI", "frontend", "form", "card", "modal".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Component pattern

```typescript
'use client'; // Only if hooks, events, or browser APIs needed

import type { ProviderProfile } from '@/types';

interface ProviderCardProps {
  provider: ProviderProfile;
  onBook?: (providerId: string) => void;
}

export default function ProviderCard({ provider, onBook }: ProviderCardProps) {
  // hooks → derived state → handlers → render
}
```

## Rules

1. Server Components by default — 'use client' only when necessary
2. Props always typed via interface above the component
3. Types from `src/types/` — never redefine locally
4. Tailwind only — no inline styles, no CSS files
5. Mobile-first — TownHelp is a PWA for Indian mobile users
6. Every async component needs loading skeleton and error UI

## Directory structure

```
src/components/
├── ui/           # Button, Input, Card, Modal, Badge
├── providers/    # ProviderCard, ProviderList
├── bookings/     # BookingCard, BookingForm, StatusBadge
├── chat/         # MessageBubble, ConversationList
├── reviews/      # ReviewCard, StarRating
└── layout/       # Navbar, BottomNav, PageWrapper
```
