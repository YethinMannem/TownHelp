'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { readAllNotifications } from '@/app/actions/notification'

export default function MarkAllReadButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await readAllNotifications()
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-primary font-semibold font-body disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
    >
      {isPending ? 'Marking...' : 'Mark all read'}
    </button>
  )
}
