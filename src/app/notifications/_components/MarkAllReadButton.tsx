'use client'

import { useState, useTransition } from 'react'
import { readAllNotifications } from '@/app/actions/notification'

export default function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleClick() {
    startTransition(async () => {
      await readAllNotifications()
      setDone(true)
    })
  }

  if (done) {
    return (
      <span className="text-xs text-on-surface-variant font-body">All read</span>
    )
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
