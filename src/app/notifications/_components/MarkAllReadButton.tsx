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
      <span className="text-xs text-gray-400">All marked as read</span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Marking...' : 'Mark all read'}
    </button>
  )
}
