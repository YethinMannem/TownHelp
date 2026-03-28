import { prisma } from '@/lib/prisma'
import type { BookingStatus } from '@/generated/prisma'
import type { BookingTransitionResult } from '@/types'

// =============================================================================
// State Machine
// =============================================================================

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: [],
}

type TransitionRole = 'provider' | 'requester' | 'either'

const TRANSITION_AUTH: Record<string, TransitionRole> = {
  'PENDING→CONFIRMED': 'provider',
  'PENDING→CANCELLED': 'either',
  'CONFIRMED→IN_PROGRESS': 'provider',
  'CONFIRMED→CANCELLED': 'either',
  'IN_PROGRESS→COMPLETED': 'provider',
  'IN_PROGRESS→DISPUTED': 'either',
  'COMPLETED→DISPUTED': 'either',
}

// Timestamp field to set for each target status
const STATUS_TIMESTAMPS: Partial<Record<BookingStatus, string>> = {
  CONFIRMED: 'confirmedAt',
  IN_PROGRESS: 'startedAt',
  COMPLETED: 'completedAt',
  CANCELLED: 'cancelledAt',
}

// Notification config per transition
const TRANSITION_NOTIFICATIONS: Record<string, {
  notifyRole: 'requester' | 'provider'
  type: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'
  title: string
  body: (bookingNumber: string) => string
}> = {
  'PENDING→CONFIRMED': {
    notifyRole: 'requester',
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed',
    body: (bn) => `Your booking ${bn} has been confirmed by the provider.`,
  },
  'PENDING→CANCELLED': {
    notifyRole: 'requester', // overridden at runtime if provider cancels
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    body: (bn) => `Booking ${bn} has been cancelled.`,
  },
  'CONFIRMED→IN_PROGRESS': {
    notifyRole: 'requester',
    type: 'BOOKING_CONFIRMED',
    title: 'Service Started',
    body: (bn) => `The provider has started working on booking ${bn}.`,
  },
  'CONFIRMED→CANCELLED': {
    notifyRole: 'requester',
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    body: (bn) => `Booking ${bn} has been cancelled.`,
  },
  'IN_PROGRESS→COMPLETED': {
    notifyRole: 'requester',
    type: 'BOOKING_CONFIRMED',
    title: 'Service Completed',
    body: (bn) => `Booking ${bn} has been marked as completed.`,
  },
  'IN_PROGRESS→DISPUTED': {
    notifyRole: 'requester',
    type: 'BOOKING_CANCELLED',
    title: 'Dispute Opened',
    body: (bn) => `A dispute has been opened for booking ${bn}.`,
  },
  'COMPLETED→DISPUTED': {
    notifyRole: 'requester',
    type: 'BOOKING_CANCELLED',
    title: 'Dispute Opened',
    body: (bn) => `A dispute has been opened for booking ${bn}.`,
  },
}

// =============================================================================
// Core Transition Function
// =============================================================================

export async function transitionBookingStatus(
  bookingId: string,
  toStatus: BookingStatus,
  userId: string,
  options?: { notes?: string; finalAmount?: number }
): Promise<BookingTransitionResult> {
  // 1. Fetch booking with ownership info + payment status
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingNumber: true,
      status: true,
      requesterId: true,
      providerId: true,
      quotedRate: true,
      finalAmount: true,
      provider: { select: { userId: true } },
      payment: { select: { status: true } },
    },
  })

  if (!booking) {
    return { success: false, error: 'Booking not found.' }
  }

  const currentStatus = booking.status

  // 2. Validate transition is allowed
  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed.includes(toStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${currentStatus} to ${toStatus}.`,
    }
  }

  // 3. Validate authorization
  const transitionKey = `${currentStatus}→${toStatus}`
  const requiredRole = TRANSITION_AUTH[transitionKey]

  const isRequester = booking.requesterId === userId
  const isProvider = booking.provider.userId === userId

  if (!isRequester && !isProvider) {
    return { success: false, error: 'You are not part of this booking.' }
  }

  if (requiredRole === 'provider' && !isProvider) {
    return { success: false, error: 'Only the provider can perform this action.' }
  }

  if (requiredRole === 'requester' && !isRequester) {
    return { success: false, error: 'Only the requester can perform this action.' }
  }

  // 4. Build update data
  const timestampField = STATUS_TIMESTAMPS[toStatus]
  const now = new Date()

  const updateData: Record<string, unknown> = {
    status: toStatus,
    ...(timestampField && { [timestampField]: now }),
    ...(toStatus === 'COMPLETED' && options?.finalAmount != null && {
      finalAmount: options.finalAmount,
    }),
  }

  // 5. Atomic check-and-set + audit log + payment (on completion) + stats
  const result = await prisma.$transaction(async (tx) => {
    // Atomic: only update if status hasn't changed since we read it
    const updated = await tx.booking.updateMany({
      where: { id: bookingId, status: currentStatus },
      data: updateData,
    })

    if (updated.count === 0) {
      return { success: false as const, error: 'Booking status has already changed. Please refresh.' }
    }

    // Audit log
    await tx.bookingStatusLog.create({
      data: {
        bookingId,
        fromStatus: currentStatus,
        toStatus,
        changedBy: userId,
        notes: options?.notes ?? null,
      },
    })

    if (toStatus === 'COMPLETED') {
      // Increment completedBookings on provider profile
      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: { completedBookings: { increment: 1 } },
      })

      // Payment happens after completion — no auto-creation here.
      // Requester pays via Razorpay after service is done.
    }

    return { success: true as const }
  })

  if (!result.success) {
    return result
  }

  // 6. Notification — outside the transaction so a notification failure never
  //    rolls back a completed booking transition.
  const notifConfig = TRANSITION_NOTIFICATIONS[transitionKey]
  if (notifConfig) {
    const notifyUserId = isProvider ? booking.requesterId : booking.provider.userId

    try {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          channel: 'IN_APP',
          type: notifConfig.type,
          title: notifConfig.title,
          body: notifConfig.body(booking.bookingNumber),
          data: { bookingId, fromStatus: currentStatus, toStatus },
        },
      })
    } catch (notifError) {
      console.error(
        `[transitionBookingStatus] notification failed for booking ${bookingId}:`,
        notifError,
      )
      // Non-fatal: booking transition already succeeded
    }
  }

  return {
    success: true,
    booking: { id: bookingId, status: toStatus },
  }
}

// =============================================================================
// Actions Helper — compute what a user can do with a booking
// =============================================================================

export function computeBookingActions(
  status: BookingStatus,
  userId: string,
  requesterId: string,
  providerUserId: string,
  paymentStatus?: string
): {
  canConfirm: boolean
  canReject: boolean
  canStart: boolean
  canComplete: boolean
  canCancel: boolean
  canDispute: boolean
  awaitingPayment: boolean
} {
  const isRequester = userId === requesterId
  const isProvider = userId === providerUserId
  const isPaid = paymentStatus === 'COMPLETED'

  if (!isRequester && !isProvider) {
    return {
      canConfirm: false,
      canReject: false,
      canStart: false,
      canComplete: false,
      canCancel: false,
      canDispute: false,
      awaitingPayment: false,
    }
  }

  // Requester sees "awaiting payment" after service is completed but not yet paid
  const awaitingPayment = isRequester && status === 'COMPLETED' && !isPaid

  return {
    canConfirm: isProvider && status === 'PENDING',
    canReject: isProvider && status === 'PENDING',
    canStart: isProvider && status === 'CONFIRMED',
    canComplete: isProvider && status === 'IN_PROGRESS',
    canCancel:
      (status === 'PENDING' && (isRequester || isProvider)) ||
      (status === 'CONFIRMED' && (isRequester || isProvider)),
    canDispute:
      (status === 'IN_PROGRESS' && (isRequester || isProvider)) ||
      (status === 'COMPLETED' && (isRequester || isProvider)),
    awaitingPayment,
  }
}
