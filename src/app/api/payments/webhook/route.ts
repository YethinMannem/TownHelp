import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent } from '@/services/payment.service'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })
  }

  let body: string
  try {
    body = await req.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read body.' }, { status: 400 })
  }

  try {
    const result = await handleWebhookEvent(body, signature)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[webhook route] unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
