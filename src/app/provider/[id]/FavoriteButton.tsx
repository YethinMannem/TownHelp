'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toggleFavorite } from '@/app/actions/favorite'
import { cn } from '@/lib/cn'

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
      className={cn(
        'w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:opacity-60 disabled:pointer-events-none shrink-0',
        favorited
          ? 'bg-error-container border-error text-error'
          : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
      )}
    >
      <Heart
        className={cn('w-5 h-5 transition-all', favorited && 'fill-current')}
      />
    </button>
  )
}
