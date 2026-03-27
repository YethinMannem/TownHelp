'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
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
  const user = await requireAuthUser()
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
  return getProviderReviewsService(providerUserId)
}
