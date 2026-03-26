---
name: creating-api-routes
description: >
  Creates Next.js App Router API routes and server actions for TownHelp.
  Activates when building endpoints, route handlers, or server-side data
  mutations. Triggers on "API", "endpoint", "route handler", "server action".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# API Route & Server Action Patterns

## When to use what

- **Server Actions** (`src/app/actions/`) — form submissions, simple mutations, redirects
- **Route Handlers** (`src/app/api/`) — complex queries, pagination, external webhooks, REST endpoints

## Route Handler template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check — always first
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation (query params, body)
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // 3. Business logic via Prisma
    const result = await prisma.providerService.findMany({
      where: { ...(categoryId && { categoryId }) },
      include: { provider: true, category: true },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[GET /api/resource]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Server Action template

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function createBooking(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');

  // Sync check — ensure user exists in public.users
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect('/login');

  try {
    const booking = await prisma.booking.create({
      data: {
        requesterId: dbUser.id,
        providerServiceId: formData.get('providerServiceId') as string,
        scheduledAt: new Date(formData.get('scheduledAt') as string),
        status: 'PENDING',
      },
    });

    // Audit trail — every booking state change gets logged
    await prisma.bookingStatusLog.create({
      data: {
        bookingId: booking.id,
        status: 'PENDING',
        changedBy: dbUser.id,
      },
    });

    redirect(`/bookings/${booking.id}`);
  } catch (error) {
    console.error('[createBooking]:', error);
    return { error: 'Failed to create booking' };
  }
}
```

## TownHelp-specific patterns

### Pagination (provider discovery, bookings list)

```typescript
const page = parseInt(searchParams.get('page') || '1');
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.providerProfile.findMany({
    where: { deletedAt: null, verificationStatus: 'VERIFIED' },
    skip,
    take: limit,
    orderBy: { averageRating: 'desc' },
  }),
  prisma.providerProfile.count({
    where: { deletedAt: null, verificationStatus: 'VERIFIED' },
  }),
]);

return NextResponse.json({ data, total, page, limit });
```

### Booking state machine

Valid transitions — enforce these in every status update:

```
PENDING → CONFIRMED | CANCELLED
CONFIRMED → IN_PROGRESS | CANCELLED
IN_PROGRESS → COMPLETED | DISPUTED
COMPLETED → (terminal)
CANCELLED → (terminal)
DISPUTED → COMPLETED | CANCELLED
```

Always create a `BookingStatusLog` entry on every transition.

### Soft-delete aware queries

Always filter `deletedAt: null` for User and ProviderProfile:

```typescript
const provider = await prisma.providerProfile.findFirst({
  where: { id: providerId, deletedAt: null },
});
if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
```

## Rules

1. **Auth check first** — verify user before any DB operation
2. **Prisma for DB** — never raw SQL or Supabase client for queries
3. **Try/catch everything** — log with `[METHOD /path]:` or `[actionName]:` prefix
4. **Soft-delete aware** — always filter `deletedAt: null` on User and ProviderProfile
5. **Audit trail** — BookingStatusLog on every booking state change
6. **No self-operations** — users cannot book themselves, review themselves
7. **Validated transitions** — booking status changes must follow the state machine
8. **Decimal precision** — money as `Decimal(10,2)`, ratings as `Decimal(3,2)`
