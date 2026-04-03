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
      className="text-sm text-error font-semibold font-body disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
    >
      {isPending ? 'Removing...' : 'Remove'}
    </button>
  )
}
