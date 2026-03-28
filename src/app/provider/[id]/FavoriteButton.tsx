'use client'

import { useState, useTransition } from 'react'
import { toggleFavorite } from '@/app/actions/favorite'

interface FavoriteButtonProps {
  providerId: string
  initialFavorited: boolean
}

export default function FavoriteButton({ providerId, initialFavorited }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const nowFavorited = await toggleFavorite(providerId)
      setFavorited(nowFavorited)
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={favorited}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60 ${
        favorited
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span aria-hidden="true">{favorited ? '♥' : '♡'}</span>
      {favorited ? 'Saved' : 'Save'}
    </button>
  )
}
