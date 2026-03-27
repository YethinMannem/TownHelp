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
  // 1. Fetch booking with ownership info
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingNumber: true,
      status: true,
      requesterId: true,
      providerId: true,
      provider: { select: { userId: true } },
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

  // 5. Atomic check-and-set + audit log + notification + stats in one transaction
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

    // Increment completedBookings on provider profile
    if (toStatus === 'COMPLETED') {
      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: { completedBookings: { increment: 1 } },
      })
    }

    // Create notification for the other party
    const notifConfig = TRANSITION_NOTIFICATIONS[transitionKey]
    if (notifConfig) {
      // Determine who to notify: the other party
      let notifyUserId: string
      if (isProvider) {
        notifyUserId = booking.requesterId
      } else {
        notifyUserId = booking.provider.userId
      }

      await tx.notification.create({
        data: {
          userId: notifyUserId,
          channel: 'IN_APP',
          type: notifConfig.type,
          title: notifConfig.title,
          body: notifConfig.body(booking.bookingNumber),
          data: { bookingId, fromStatus: currentStatus, toStatus },
        },
      })
    }

    return { success: true as const }
  })

  if (!result.success) {
    return result
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
  providerUserId: string
): {
  canConfirm: boolean
  canReject: boolean
  canStart: boolean
  canComplete: boolean
  canCancel: boolean
  canDispute: boolean
} {
  const isRequester = userId === requesterId
  const isProvider = userId === providerUserId

  if (!isRequester && !isProvider) {
    return {
      canConfirm: false,
      canReject: false,
      canStart: false,
      canComplete: false,
      canCancel: false,
      canDispute: false,
    }
  }

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
  }
}
