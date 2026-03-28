'use client'

import { useTransition } from 'react'
import { readNotification } from '@/app/actions/notification'
import type { NotificationItem } from '@/types'

interface NotificationRowProps {
  notification: NotificationItem
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationRow({ notification }: NotificationRowProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (notification.isRead) return
    startTransition(async () => {
      await readNotification(notification.id)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || notification.isRead}
      className={[
        'w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors',
        notification.isRead
          ? 'bg-white'
          : 'bg-blue-50 hover:bg-blue-100 cursor-pointer',
        isPending ? 'opacity-60' : '',
      ].join(' ')}
      aria-label={notification.isRead ? notification.title : `Mark as read: ${notification.title}`}
    >
      <div className="flex items-start gap-3">
        {!notification.isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
        )}
        {notification.isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden="true" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
          <p className="text-xs text-gray-400 mt-1">{formatTimestamp(notification.createdAt)}</p>
        </div>
      </div>
    </button>
  )
}
