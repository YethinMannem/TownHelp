import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { verifyPayment } from '@/services/payment.service'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    bookingId: string
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

  if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json(
      { error: 'Missing required fields: bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature.' },
      { status: 400 }
    )
  }

  const result = await verifyPayment(
    bookingId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    user.id
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, paymentId: result.paymentId })
}
