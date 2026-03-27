import { prisma } from '@/lib/prisma'
import type { ReviewResult, ReviewItem } from '@/types'

interface SubmitReviewParams {
  bookingId: string
  userId: string
  rating: number
  comment?: string
}

export async function submitReview(params: SubmitReviewParams): Promise<ReviewResult> {
  const { bookingId, userId, rating, comment } = params

  // Validate rating
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be an integer between 1 and 5.' }
  }

  // Fetch booking with ownership info
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      provider: { select: { id: true, userId: true } },
    },
  })

  if (!booking) {
    return { success: false, error: 'Booking not found.' }
  }

  if (booking.status !== 'COMPLETED') {
    return { success: false, error: 'You can only review completed bookings.' }
  }

  if (booking.requesterId !== userId) {
    return { success: false, error: 'Only the requester can review a booking.' }
  }

  const revieweeId = booking.provider.userId

  // Transaction: create review + recalculate provider rating
  try {
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId,
          reviewerId: userId,
          revieweeId,
          rating,
          comment: comment?.trim() || null,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      })

      // Recalculate from all visible reviews for this provider
      const aggregate = await tx.review.aggregate({
        where: { revieweeId, isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      })

      const newAvg = Math.round((aggregate._avg.rating ?? 0) * 100) / 100
      const newCount = aggregate._count.rating

      await tx.providerProfile.update({
        where: { id: booking.provider.id },
        data: {
          ratingAvg: newAvg,
          ratingCount: newCount,
        },
      })

      return created
    })

    return {
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      },
    }
  } catch (error: unknown) {
    // Unique constraint on bookingId — duplicate review
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { success: false, error: 'You have already reviewed this booking.' }
    }
    console.error('[submitReview]:', error)
    return { success: false, error: 'Failed to submit review. Please try again.' }
  }
}

export async function getProviderReviews(providerUserId: string): Promise<ReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: providerUserId,
      isVisible: true,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      reviewer: {
        select: { fullName: true },
      },
      booking: {
        select: {
          category: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    reviewerName: r.reviewer.fullName,
    categoryName: r.booking.category.name,
  }))
}
