'use client'

import { useState, useTransition } from 'react'
import { submitReview } from '@/app/actions/review'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ReviewButtonProps {
  bookingId: string
  hasReview: boolean
  isCompleted: boolean
}

export default function ReviewButton({ bookingId, hasReview, isCompleted }: ReviewButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const { toast } = useToast()

  if (!isCompleted || hasReview) return null

  if (!showForm) {
    return (
      <div className="mt-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowForm(true)}
        >
          Write Review
        </Button>
      </div>
    )
  }

  function handleSubmit(): void {
    startTransition(async () => {
      const result = await submitReview(bookingId, rating, comment || undefined)
      if (result.success) {
        setShowForm(false)
        toast('Review submitted!', 'success')
      } else {
        toast(result.error || 'Failed to submit review.', 'error')
      }
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-on-surface-variant font-body">Rating</span>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              onClick={() => setRating(n)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-500 transition-colors hover:bg-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  n <= rating ? 'fill-amber-500' : 'text-outline-variant'
                )}
              />
            </button>
          ))}
        </div>
        <span className="text-xs font-body font-medium text-on-surface">{rating}/5</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was the service? (optional)"
        className="w-full text-xs border border-outline-variant rounded-xl p-3 resize-none bg-surface-container text-on-surface font-body placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
        rows={2}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={isPending}
          onClick={handleSubmit}
        >
          Submit Review
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
