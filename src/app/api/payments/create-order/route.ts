/*
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createPaymentOrder } from '@/services/payment.service'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let bookingId: string
  try {
    const body = await req.json()
    bookingId = body.bookingId
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!bookingId || typeof bookingId !== 'string' || !UUID_RE.test(bookingId)) {
    return NextResponse.json({ error: 'Invalid bookingId format.' }, { status: 400 })
  }

  const result = await createPaymentOrder(bookingId, user.id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result.data)
}
*/

import { NextResponse } from 'next/server'

// Razorpay payment routes disabled for MVP.
// Payments are tracked offline — see src/services/payment.service.ts
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Online payments are not available yet. Please pay the provider directly.' },
    { status: 501 }
  )
}
