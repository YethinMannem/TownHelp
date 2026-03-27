import { describe, it, expect } from 'vitest'
import { prismaMock, mockTransaction } from './prisma.mock'
import { transitionBookingStatus, computeBookingActions } from '../booking.service'
import {
  REQUESTER_ID,
  PROVIDER_USER_ID,
  PROVIDER_PROFILE_ID,
  BOOKING_ID,
  OTHER_USER_ID,
  makeBooking,
} from './test-fixtures'

// =============================================================================
// computeBookingActions — pure logic, no mocks needed
// =============================================================================

describe('computeBookingActions', () => {
  it('returns all false for a user not part of the booking', () => {
    const actions = computeBookingActions('PENDING', OTHER_USER_ID, REQUESTER_ID, PROVIDER_USER_ID)
    expect(Object.values(actions).every((v) => v === false)).toBe(true)
  })

  describe('PENDING booking', () => {
    it('provider can confirm and reject', () => {
      const actions = computeBookingActions('PENDING', PROVIDER_USER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(actions.canConfirm).toBe(true)
      expect(actions.canReject).toBe(true)
      expect(actions.canCancel).toBe(true)
      expect(actions.canStart).toBe(false)
      expect(actions.canComplete).toBe(false)
      expect(actions.canDispute).toBe(false)
    })

    it('requester can cancel but not confirm', () => {
      const actions = computeBookingActions('PENDING', REQUESTER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(actions.canCancel).toBe(true)
      expect(actions.canConfirm).toBe(false)
      expect(actions.canReject).toBe(false)
    })
  })

  describe('CONFIRMED booking', () => {
    it('provider can start or cancel', () => {
      const actions = computeBookingActions('CONFIRMED', PROVIDER_USER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(actions.canStart).toBe(true)
      expect(actions.canCancel).toBe(true)
      expect(actions.canConfirm).toBe(false)
      expect(actions.canComplete).toBe(false)
    })

    it('requester can cancel but not start', () => {
      const actions = computeBookingActions('CONFIRMED', REQUESTER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(actions.canCancel).toBe(true)
      expect(actions.canStart).toBe(false)
    })
  })

  describe('IN_PROGRESS booking', () => {
    it('provider can complete or dispute', () => {
      const actions = computeBookingActions('IN_PROGRESS', PROVIDER_USER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(actions.canComplete).toBe(true)
      expect(actions.canDispute).toBe(true)
      expect(actions.canCancel).toBe(false)
    })

    it('requester can dispute but not complete', () => {
      const actions = computeBookingActions('IN_PROGRESS', REQUESTER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(actions.canDispute).toBe(true)
      expect(actions.canComplete).toBe(false)
      expect(actions.canCancel).toBe(false)
    })
  })

  describe('COMPLETED booking', () => {
    it('either party can dispute', () => {
      const requesterActions = computeBookingActions('COMPLETED', REQUESTER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      const providerActions = computeBookingActions('COMPLETED', PROVIDER_USER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(requesterActions.canDispute).toBe(true)
      expect(providerActions.canDispute).toBe(true)
    })

    it('no other actions available', () => {
      const actions = computeBookingActions('COMPLETED', REQUESTER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(actions.canConfirm).toBe(false)
      expect(actions.canStart).toBe(false)
      expect(actions.canComplete).toBe(false)
      expect(actions.canCancel).toBe(false)
    })
  })

  describe('terminal statuses', () => {
    it('CANCELLED has no actions', () => {
      const actions = computeBookingActions('CANCELLED', REQUESTER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(Object.values(actions).every((v) => v === false)).toBe(true)
    })

    it('DISPUTED has no actions', () => {
      const actions = computeBookingActions('DISPUTED', REQUESTER_ID, REQUESTER_ID, PROVIDER_USER_ID)
      expect(Object.values(actions).every((v) => v === false)).toBe(true)
    })
  })
})

// =============================================================================
// transitionBookingStatus — uses isolated tx mock
// =============================================================================

describe('transitionBookingStatus', () => {
  // --- Error paths (no transaction needed) ---

  it('returns error when booking not found', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(null)

    const result = await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', PROVIDER_USER_ID)
    expect(result).toEqual({ success: false, error: 'Booking not found.' })
  })

  it('rejects invalid status transition', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))

    const result = await transitionBookingStatus(BOOKING_ID, 'COMPLETED', PROVIDER_USER_ID)
    expect(result).toEqual({
      success: false,
      error: 'Cannot transition from PENDING to COMPLETED.',
    })
  })

  it('rejects transition from terminal status', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('CANCELLED'))

    const result = await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', PROVIDER_USER_ID)
    expect(result).toEqual({
      success: false,
      error: 'Cannot transition from CANCELLED to CONFIRMED.',
    })
  })

  it('rejects unauthorized user', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))

    const result = await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', OTHER_USER_ID)
    expect(result).toEqual({
      success: false,
      error: 'You are not part of this booking.',
    })
  })

  it('rejects requester trying to confirm', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))

    const result = await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', REQUESTER_ID)
    expect(result).toEqual({
      success: false,
      error: 'Only the provider can perform this action.',
    })
  })

  // --- Happy paths with isolated tx mock ---

  it('allows provider to confirm a PENDING booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    const result = await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', PROVIDER_USER_ID)
    expect(result).toEqual({
      success: true,
      booking: { id: BOOKING_ID, status: 'CONFIRMED' },
    })

    // Verify service uses tx, not prisma
    expect(tx.booking.updateMany).toHaveBeenCalled()
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled()
  })

  it('allows either party to cancel a PENDING booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    const result = await transitionBookingStatus(BOOKING_ID, 'CANCELLED', REQUESTER_ID)
    expect(result).toEqual({
      success: true,
      booking: { id: BOOKING_ID, status: 'CANCELLED' },
    })
  })

  it('provider can start a CONFIRMED booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('CONFIRMED'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    const result = await transitionBookingStatus(BOOKING_ID, 'IN_PROGRESS', PROVIDER_USER_ID)
    expect(result).toEqual({
      success: true,
      booking: { id: BOOKING_ID, status: 'IN_PROGRESS' },
    })
  })

  it('either party can cancel a CONFIRMED booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('CONFIRMED'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    const result = await transitionBookingStatus(BOOKING_ID, 'CANCELLED', PROVIDER_USER_ID)
    expect(result).toEqual({
      success: true,
      booking: { id: BOOKING_ID, status: 'CANCELLED' },
    })
  })

  it('either party can dispute an IN_PROGRESS booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('IN_PROGRESS'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    const result = await transitionBookingStatus(BOOKING_ID, 'DISPUTED', REQUESTER_ID)
    expect(result).toEqual({
      success: true,
      booking: { id: BOOKING_ID, status: 'DISPUTED' },
    })
  })

  it('either party can dispute a COMPLETED booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('COMPLETED'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    const result = await transitionBookingStatus(BOOKING_ID, 'DISPUTED', REQUESTER_ID)
    expect(result).toEqual({
      success: true,
      booking: { id: BOOKING_ID, status: 'DISPUTED' },
    })
  })

  // --- Audit log verification (#2) ---

  it('writes correct audit log on transition', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', PROVIDER_USER_ID, { notes: 'Accepted via app' })

    expect(tx.bookingStatusLog.create).toHaveBeenCalledWith({
      data: {
        bookingId: BOOKING_ID,
        fromStatus: 'PENDING',
        toStatus: 'CONFIRMED',
        changedBy: PROVIDER_USER_ID,
        notes: 'Accepted via app',
      },
    })
  })

  it('writes null notes when none provided', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('CONFIRMED'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    await transitionBookingStatus(BOOKING_ID, 'IN_PROGRESS', PROVIDER_USER_ID)

    expect(tx.bookingStatusLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStatus: 'CONFIRMED',
        toStatus: 'IN_PROGRESS',
        notes: null,
      }),
    })
  })

  // --- Side effects ---

  it('increments completedBookings on COMPLETED transition', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('IN_PROGRESS'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.providerProfile.update.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    await transitionBookingStatus(BOOKING_ID, 'COMPLETED', PROVIDER_USER_ID)

    expect(tx.providerProfile.update).toHaveBeenCalledWith({
      where: { id: PROVIDER_PROFILE_ID },
      data: { completedBookings: { increment: 1 } },
    })
  })

  it('does not increment completedBookings on non-COMPLETED transition', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', PROVIDER_USER_ID)

    expect(tx.providerProfile.update).not.toHaveBeenCalled()
  })

  it('sets finalAmount on COMPLETED transition', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('IN_PROGRESS'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.providerProfile.update.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    await transitionBookingStatus(BOOKING_ID, 'COMPLETED', PROVIDER_USER_ID, { finalAmount: 500 })

    expect(tx.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          finalAmount: 500,
        }),
      })
    )
  })

  // --- Notifications ---

  it('notifies requester when provider confirms', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', PROVIDER_USER_ID)

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: REQUESTER_ID,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
      }),
    })
  })

  it('notifies provider when requester cancels', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 1 })
    tx.bookingStatusLog.create.mockResolvedValue({})
    tx.notification.create.mockResolvedValue({})

    await transitionBookingStatus(BOOKING_ID, 'CANCELLED', REQUESTER_ID)

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: PROVIDER_USER_ID,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
      }),
    })
  })

  // --- Concurrency ---

  it('handles optimistic concurrency failure', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeBooking('PENDING'))
    const tx = mockTransaction()
    tx.booking.updateMany.mockResolvedValue({ count: 0 })

    const result = await transitionBookingStatus(BOOKING_ID, 'CONFIRMED', PROVIDER_USER_ID)
    expect(result).toEqual({
      success: false,
      error: 'Booking status has already changed. Please refresh.',
    })
  })
})
