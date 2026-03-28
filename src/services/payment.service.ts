/*
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import type { PaymentMethod } from '@/generated/prisma'
import type {
  PaymentOrderResult,
  PaymentVerifyResult,
  RazorpayWebhookPayload,
} from '@/types/payment'

// =============================================================================
// Razorpay Client (singleton with startup guard)
// =============================================================================

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be set in environment variables.`)
  }
  return value
}

const KEY_ID = getRequiredEnv('RAZORPAY_KEY_ID')
const KEY_SECRET = getRequiredEnv('RAZORPAY_KEY_SECRET')

const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })

// Map Razorpay method strings to our PaymentMethod enum
// TODO: Add NETBANKING to PaymentMethod enum (prisma/schema.prisma)
const METHOD_MAP: Record<string, PaymentMethod> = {
  upi: 'UPI',
  card: 'CARD',
  wallet: 'WALLET',
  netbanking: 'CARD', // placeholder until NETBANKING enum value exists
}

// Timing-safe string comparison that handles different lengths without throwing
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// Resolve payment method from Razorpay, log unknown methods
function resolvePaymentMethod(method: unknown): PaymentMethod {
  if (typeof method !== 'string') return 'UPI'
  if (!METHOD_MAP[method]) {
    console.error(`[payment] Unknown Razorpay method: ${method}, defaulting to UPI`)
  }
  return METHOD_MAP[method] ?? 'UPI'
}

// Compare amounts using integer paise to avoid floating-point issues
function amountsMatch(dbAmount: unknown, razorpayPaise: number): boolean {
  const expectedPaise = Math.round(Number(dbAmount) * 100)
  return expectedPaise === razorpayPaise
}

// =============================================================================
// Create Order
// =============================================================================

export async function createPaymentOrder(
  bookingId: string,
  userId: string
): Promise<PaymentOrderResult> {
  try {
    // 1. Fetch booking + validate ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        requesterId: true,
        quotedRate: true,
        finalAmount: true,
        requester: {
          select: { fullName: true, email: true, phone: true },
        },
        payment: {
          select: { id: true, status: true, externalTxnId: true },
        },
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found.' }
    }

    if (booking.requesterId !== userId) {
      return { success: false, error: 'Only the requester can pay for this booking.' }
    }

    if (booking.status !== 'COMPLETED') {
      return { success: false, error: 'Payment is available after the service is completed.' }
    }

    // 2. Check for existing completed payment
    if (booking.payment?.status === 'COMPLETED') {
      return { success: false, error: 'This booking has already been paid.' }
    }

    // 3. Calculate amount in paise
    const amountInRupees = booking.finalAmount != null
      ? Number(booking.finalAmount)
      : booking.quotedRate != null
        ? Number(booking.quotedRate)
        : 0

    if (amountInRupees <= 0) {
      return { success: false, error: 'Booking has no valid amount to charge.' }
    }

    const amountInPaise = Math.round(amountInRupees * 100)

    // 4. Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
      },
    })

    // 5. Upsert payment record (update if PENDING/FAILED, create if none)
    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          externalTxnId: order.id,
          status: 'PENDING',
          amount: amountInRupees,
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          idempotencyKey: `razorpay-${booking.id}`,
          amount: amountInRupees,
          paymentMethod: 'UPI', // default, updated on verification
          status: 'PENDING',
          externalTxnId: order.id,
        },
      })
    }

    return {
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: KEY_ID,
        bookingNumber: booking.bookingNumber,
        prefill: {
          name: booking.requester.fullName,
          email: booking.requester.email,
          contact: booking.requester.phone,
        },
      },
    }
  } catch (error) {
    // Handle race condition: concurrent payment creation hits unique constraint
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return { success: false, error: 'A payment is already being processed. Please refresh.' }
    }
    console.error('[createPaymentOrder] failed:', error)
    return { success: false, error: 'Failed to create payment order. Please try again.' }
  }
}

// =============================================================================
// Verify Payment (client-side callback — fast path)
// =============================================================================

export async function verifyPayment(
  bookingId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  userId: string
): Promise<PaymentVerifyResult> {
  try {
    // 1. Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      select: {
        id: true,
        status: true,
        amount: true,
        externalTxnId: true,
        booking: {
          select: { requesterId: true },
        },
      },
    })

    if (!payment) {
      return { success: false, error: 'No payment record found for this booking.' }
    }

    if (payment.booking.requesterId !== userId) {
      return { success: false, error: 'Unauthorized.' }
    }

    // Idempotent: if already completed, return success
    if (payment.status === 'COMPLETED') {
      return { success: true, paymentId: payment.id }
    }

    // Verify the order ID matches what we stored
    if (payment.externalTxnId !== razorpayOrderId) {
      return { success: false, error: 'Order ID mismatch.' }
    }

    // 2. Verify HMAC signature (timing-safe)
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (!safeCompare(expectedSignature, razorpaySignature)) {
      console.error('[verifyPayment] Signature mismatch for booking:', bookingId)
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      })
      return { success: false, error: 'Payment verification failed.' }
    }

    // 3. Fetch payment from Razorpay to confirm amount
    const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId)
    const paidPaise = Number(rzpPayment.amount)

    if (!amountsMatch(payment.amount, paidPaise)) {
      console.error(
        `[verifyPayment] Amount mismatch: expected ₹${payment.amount}, got ${paidPaise} paise`
      )
      return { success: false, error: 'Payment amount mismatch.' }
    }

    // 4. Update payment record
    const method = resolvePaymentMethod(rzpPayment.method)

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paymentMethod: method,
        paidAt: new Date(),
        gatewayResponse: {
          razorpayPaymentId,
          razorpayOrderId,
          method: rzpPayment.method,
          bank: rzpPayment.bank,
          wallet: rzpPayment.wallet,
          vpa: rzpPayment.vpa,
        },
      },
    })

    // 5. Send payment notification (non-fatal)
    try {
      const paidRupees = paidPaise / 100
      await prisma.notification.create({
        data: {
          userId,
          channel: 'IN_APP',
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Successful',
          body: `Payment of ₹${paidRupees} received for your booking.`,
          data: { bookingId, paymentId: payment.id },
        },
      })
    } catch (notifError) {
      console.error('[verifyPayment] notification failed:', notifError)
    }

    return { success: true, paymentId: payment.id }
  } catch (error) {
    console.error('[verifyPayment] failed:', error)
    return { success: false, error: 'Could not verify payment with gateway.' }
  }
}

// =============================================================================
// Webhook Handler (Razorpay → our server — source of truth)
// =============================================================================

export async function handleWebhookEvent(
  body: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Verify webhook signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not configured')
    return { success: false, error: 'Webhook secret not configured.' }
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  if (!safeCompare(expectedSignature, signature)) {
    console.error('[webhook] Invalid webhook signature')
    return { success: false, error: 'Invalid signature.' }
  }

  // 2. Parse payload
  let event: RazorpayWebhookPayload
  try {
    event = JSON.parse(body) as RazorpayWebhookPayload
  } catch {
    console.error('[webhook] Failed to parse webhook body as JSON')
    return { success: false, error: 'Invalid JSON payload.' }
  }

  // Only handle payment.captured
  if (event.event !== 'payment.captured') {
    return { success: true } // ack other events silently
  }

  try {
    const rzpPayment = event.payload.payment.entity
    const orderId = rzpPayment.order_id
    const paymentId = rzpPayment.id
    const paidPaise = rzpPayment.amount

    // 3. Find payment by Razorpay order ID
    const payment = await prisma.payment.findFirst({
      where: { externalTxnId: orderId },
      select: { id: true, status: true, bookingId: true, amount: true },
    })

    if (!payment) {
      console.error(`[webhook] No payment found for order ${orderId}`)
      return { success: false, error: 'Payment record not found.' }
    }

    // Idempotent: skip if already completed
    if (payment.status === 'COMPLETED') {
      return { success: true }
    }

    // 4. Verify amount matches (integer paise comparison)
    if (!amountsMatch(payment.amount, paidPaise)) {
      console.error(
        `[webhook] Amount mismatch for order ${orderId}: expected ₹${payment.amount}, got ${paidPaise} paise`
      )
      return { success: false, error: 'Amount mismatch.' }
    }

    // 5. Update payment record
    const method = resolvePaymentMethod(rzpPayment.method)

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paymentMethod: method,
        paidAt: new Date(),
        gatewayResponse: {
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          method: rzpPayment.method,
          source: 'webhook',
        },
      },
    })

    // 6. Notify requester (non-fatal)
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        select: { requesterId: true },
      })

      if (booking) {
        const paidRupees = paidPaise / 100
        await prisma.notification.create({
          data: {
            userId: booking.requesterId,
            channel: 'IN_APP',
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Successful',
            body: `Payment of ₹${paidRupees} received for your booking.`,
            data: { bookingId: payment.bookingId, paymentId: payment.id },
          },
        })
      }
    } catch (notifError) {
      console.error('[webhook] notification failed:', notifError)
    }

    return { success: true }
  } catch (error) {
    console.error('[webhook] processing failed:', error)
    return { success: false, error: 'Internal error processing webhook.' }
  }
}
*/

/**
 * Offline Payment Tracking Service
 *
 * MVP approach: requester pays provider directly (cash/UPI/etc.)
 * and both parties confirm the payment through the app.
 *
 * The Razorpay integration (commented above) will be re-enabled
 * when TownHelp moves to a commission-based model.
 */

import { prisma } from '@/lib/prisma'

interface ConfirmPaymentResult {
  success: boolean
  error?: string
}

/**
 * Requester confirms they have paid the provider offline.
 * Creates/updates the payment record with status COMPLETED.
 */
export async function confirmOfflinePayment(
  bookingId: string,
  userId: string,
  paymentMethod: 'CASH' | 'UPI' = 'CASH'
): Promise<ConfirmPaymentResult> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        requesterId: true,
        quotedRate: true,
        finalAmount: true,
        provider: { select: { userId: true } },
        payment: { select: { id: true, status: true } },
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found.' }
    }

    if (booking.requesterId !== userId) {
      return { success: false, error: 'Only the requester can confirm payment.' }
    }

    if (booking.status !== 'COMPLETED') {
      return { success: false, error: 'Payment can only be confirmed after service is completed.' }
    }

    if (booking.payment?.status === 'COMPLETED') {
      return { success: false, error: 'Payment has already been confirmed.' }
    }

    const amount = booking.finalAmount != null
      ? Number(booking.finalAmount)
      : booking.quotedRate != null
        ? Number(booking.quotedRate)
        : 0

    // Upsert: update existing PENDING record or create new one
    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'COMPLETED',
          paymentMethod,
          amount,
          paidAt: new Date(),
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          idempotencyKey: `offline-${booking.id}`,
          amount,
          paymentMethod,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      })
    }

    // Notify provider that payment was confirmed (non-fatal)
    try {
      await prisma.notification.create({
        data: {
          userId: booking.provider.userId,
          channel: 'IN_APP',
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Confirmed',
          body: `The requester confirmed payment of ₹${amount} for your booking.`,
          data: { bookingId },
        },
      })
    } catch (notifError) {
      console.error('[confirmOfflinePayment] notification failed:', notifError)
    }

    return { success: true }
  } catch (error) {
    console.error('[confirmOfflinePayment] failed:', error)
    return { success: false, error: 'Failed to confirm payment. Please try again.' }
  }
}
