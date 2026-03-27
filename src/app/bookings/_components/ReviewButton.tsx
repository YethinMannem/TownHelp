'use client'

import { useState, useTransition } from 'react'
import { submitReview } from '@/app/actions/review'

// Temporary test component — Meghana will replace with styled version
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

  if (!isCompleted || hasReview) return null

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mt-2 text-xs px-3 py-1.5 rounded-md font-medium bg-amber-500 hover:bg-amber-600 text-white"
      >
        Write Review
      </button>
    )
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitReview(bookingId, rating, comment || undefined)
      if (result.success) {
        setShowForm(false)
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600">Rating:</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded px-2 py-1"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'⭐'.repeat(n)} ({n})
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was the service? (optional)"
        className="w-full text-xs border border-gray-200 rounded p-2 resize-none"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={handleSubmit}
          className="text-xs px-3 py-1.5 rounded-md font-medium bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
        >
          {isPending ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="text-xs px-3 py-1.5 rounded-md font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
