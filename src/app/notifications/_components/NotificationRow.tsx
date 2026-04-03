'use client'

import { useTransition } from 'react'
import { readNotification } from '@/app/actions/notification'
import { Bell, Calendar, Star, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'
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

function getNotificationIcon(type: string) {
  const cls = 'w-5 h-5'
  switch (type) {
    case 'BOOKING_REQUEST':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
      return <Calendar className={cls} />
    case 'REVIEW_RECEIVED':
      return <Star className={cls} />
    case 'MESSAGE_RECEIVED':
      return <MessageCircle className={cls} />
    case 'BOOKING_COMPLETED':
      return <CheckCircle className={cls} />
    case 'DISPUTE_OPENED':
    case 'REPORT_RESOLVED':
      return <AlertCircle className={cls} />
    default:
      return <Bell className={cls} />
  }
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
        'w-full text-left bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 transition-all duration-150',
        notification.isRead
          ? 'opacity-80'
          : 'hover:shadow-[0_2px_8px_rgba(27,28,27,0.08)] cursor-pointer',
        isPending ? 'opacity-60' : '',
      ].join(' ')}
      aria-label={
        notification.isRead ? notification.title : `Mark as read: ${notification.title}`
      }
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={[
            'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
            notification.isRead
              ? 'bg-surface-container text-on-surface-variant'
              : 'bg-primary-fixed text-on-primary-fixed',
          ].join(' ')}
          aria-hidden="true"
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-semibold font-body truncate ${
                notification.isRead ? 'text-on-surface-variant' : 'text-on-surface'
              }`}
            >
              {notification.title}
            </p>
            <p className="text-xs text-outline font-body shrink-0">
              {formatTimestamp(notification.createdAt)}
            </p>
          </div>
          <p className="text-sm text-on-surface-variant font-body mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        </div>

        {/* Unread dot */}
        {!notification.isRead && (
          <span
            className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  )
}
