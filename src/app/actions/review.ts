'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { isValidUUID } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  submitReview as submitReviewService,
  getProviderReviews as getProviderReviewsService,
} from '@/services/review.service'
import type { ReviewResult, ReviewItem } from '@/types'

export async function submitReview(
  bookingId: string,
  rating: number,
  comment?: string
): Promise<ReviewResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const user = await requireAuthUser()
  const { allowed } = checkRateLimit(`${user.id}:submitReview`, {
    maxRequests: 5,
    windowMs: 60_000,
  })
  if (!allowed) return { success: false, error: 'Too many requests. Please wait.' }
  const result = await submitReviewService({
    bookingId,
    userId: user.id,
    rating,
    comment,
  })

  if (result.success) {
    revalidatePath('/bookings')
    revalidatePath('/browse')
  }

  return result
}

export async function getProviderReviews(providerUserId: string): Promise<ReviewItem[]> {
  if (!isValidUUID(providerUserId)) return []
  return getProviderReviewsService(providerUserId)
}
