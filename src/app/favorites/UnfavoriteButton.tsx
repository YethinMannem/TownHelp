'use client'

import { useTransition } from 'react'
import { toggleFavorite } from '@/app/actions/favorite'

interface UnfavoriteButtonProps {
  providerId: string
  providerName: string
}

export default function UnfavoriteButton({ providerId, providerName }: UnfavoriteButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await toggleFavorite(providerId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Remove ${providerName} from favorites`}
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
    >
      {isPending ? 'Removing...' : 'Remove'}
    </button>
  )
}
