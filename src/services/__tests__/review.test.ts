import { describe, it, expect } from 'vitest'
import { prismaMock, mockTransaction } from './prisma.mock'
import { submitReview, getProviderReviews } from '../review.service'
import {
  REQUESTER_ID,
  PROVIDER_USER_ID,
  PROVIDER_PROFILE_ID,
  BOOKING_ID,
  makeCompletedBooking,
} from './test-fixtures'

describe('submitReview', () => {
  // --- Validation ---

  it('rejects rating below 1', async () => {
    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 0 })
    expect(result).toEqual({ success: false, error: 'Rating must be an integer between 1 and 5.' })
  })

  it('rejects rating above 5', async () => {
    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 6 })
    expect(result).toEqual({ success: false, error: 'Rating must be an integer between 1 and 5.' })
  })

  it('rejects non-integer rating', async () => {
    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 3.5 })
    expect(result).toEqual({ success: false, error: 'Rating must be an integer between 1 and 5.' })
  })

  it('rejects negative rating', async () => {
    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: -1 })
    expect(result).toEqual({ success: false, error: 'Rating must be an integer between 1 and 5.' })
  })

  // --- Booking checks ---

  it('returns error when booking not found', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(null)

    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 4 })
    expect(result).toEqual({ success: false, error: 'Booking not found.' })
  })

  it('rejects review on non-completed booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({ ...makeCompletedBooking(), status: 'IN_PROGRESS' })

    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 4 })
    expect(result).toEqual({ success: false, error: 'You can only review completed bookings.' })
  })

  it('rejects review from non-requester', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeCompletedBooking())

    const result = await submitReview({ bookingId: BOOKING_ID, userId: PROVIDER_USER_ID, rating: 4 })
    expect(result).toEqual({ success: false, error: 'Only the requester can review a booking.' })
  })

  // --- Happy path ---

  it('creates review and recalculates provider rating', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeCompletedBooking())

    const createdReview = {
      id: 'review-uuid',
      rating: 4,
      comment: 'Great service',
      createdAt: new Date('2026-03-27'),
    }

    const tx = mockTransaction()
    tx.review.create.mockResolvedValue(createdReview)
    tx.review.aggregate.mockResolvedValue({
      _avg: { rating: 4.5 },
      _count: { rating: 10 },
      _sum: { rating: 45 },
    })
    tx.providerProfile.update.mockResolvedValue({})

    const result = await submitReview({
      bookingId: BOOKING_ID,
      userId: REQUESTER_ID,
      rating: 4,
      comment: 'Great service',
    })

    expect(result.success).toBe(true)
    expect(result.review).toEqual(createdReview)

    // Verify uses tx, not prisma
    expect(tx.review.create).toHaveBeenCalled()
    expect(prismaMock.review.create).not.toHaveBeenCalled()

    expect(tx.providerProfile.update).toHaveBeenCalledWith({
      where: { id: PROVIDER_PROFILE_ID },
      data: { ratingAvg: 4.5, ratingCount: 10, ratingSum: 45 },
    })
  })

  it('rounds rating average to 2 decimal places', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeCompletedBooking())

    const tx = mockTransaction()
    tx.review.create.mockResolvedValue({
      id: 'r1', rating: 4, comment: null, createdAt: new Date(),
    })
    tx.review.aggregate.mockResolvedValue({
      _avg: { rating: 4.333333 },
      _count: { rating: 3 },
      _sum: { rating: 13 },
    })
    tx.providerProfile.update.mockResolvedValue({})

    await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 4 })

    expect(tx.providerProfile.update).toHaveBeenCalledWith({
      where: { id: PROVIDER_PROFILE_ID },
      data: { ratingAvg: 4.33, ratingCount: 3, ratingSum: 13 },
    })
  })

  it('handles null average when no visible reviews', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeCompletedBooking())

    const tx = mockTransaction()
    tx.review.create.mockResolvedValue({
      id: 'r1', rating: 5, comment: null, createdAt: new Date(),
    })
    tx.review.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { rating: 0 },
      _sum: { rating: null },
    })
    tx.providerProfile.update.mockResolvedValue({})

    await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 5 })

    expect(tx.providerProfile.update).toHaveBeenCalledWith({
      where: { id: PROVIDER_PROFILE_ID },
      data: { ratingAvg: 0, ratingCount: 0, ratingSum: 0 },
    })
  })

  // --- Error handling ---

  it('rejects duplicate review', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeCompletedBooking())

    const prismaError = new Error('Unique constraint failed')
    Object.assign(prismaError, { code: 'P2002' })

    prismaMock.$transaction.mockRejectedValue(prismaError)

    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 5 })
    expect(result).toEqual({ success: false, error: 'You have already reviewed this booking.' })
  })

  it('handles unexpected transaction error', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(makeCompletedBooking())
    prismaMock.$transaction.mockRejectedValue(new Error('DB connection lost'))

    const result = await submitReview({ bookingId: BOOKING_ID, userId: REQUESTER_ID, rating: 4 })
    expect(result).toEqual({ success: false, error: 'Failed to submit review. Please try again.' })
  })
})

describe('getProviderReviews', () => {
  it('returns mapped reviews for a provider', async () => {
    prismaMock.review.findMany.mockResolvedValue([
      {
        id: 'r1',
        rating: 5,
        comment: 'Excellent work',
        createdAt: new Date('2026-03-27'),
        reviewer: { fullName: 'Yethin' },
        booking: { category: { name: 'Electrician' } },
      },
      {
        id: 'r2',
        rating: 3,
        comment: null,
        createdAt: new Date('2026-03-26'),
        reviewer: { fullName: 'Meghana' },
        booking: { category: { name: 'Maid' } },
      },
    ])

    const result = await getProviderReviews(PROVIDER_USER_ID)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'r1',
      rating: 5,
      comment: 'Excellent work',
      createdAt: new Date('2026-03-27'),
      reviewerName: 'Yethin',
      categoryName: 'Electrician',
    })
    expect(result[1].reviewerName).toBe('Meghana')
    expect(result[1].comment).toBeNull()
  })

  it('returns empty array when provider has no reviews', async () => {
    prismaMock.review.findMany.mockResolvedValue([])

    const result = await getProviderReviews(PROVIDER_USER_ID)
    expect(result).toEqual([])
  })

  it('only fetches visible reviews', async () => {
    prismaMock.review.findMany.mockResolvedValue([])

    await getProviderReviews(PROVIDER_USER_ID)

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { revieweeId: PROVIDER_USER_ID, isVisible: true },
      })
    )
  })
})
