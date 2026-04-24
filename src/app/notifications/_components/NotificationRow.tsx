'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { readNotification } from '@/app/actions/notification'
import { Bell, Calendar, Star, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'
import type { NotificationItem, NotificationType } from '@/types'

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

function getNotificationIcon(type: NotificationType) {
  const cls = 'w-5 h-5'
  switch (type) {
    case 'BOOKING_REQUEST':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
      return <Calendar className={cls} />
    case 'REVIEW_RECEIVED':
      return <Star className={cls} />
    case 'MESSAGE_NEW':
      return <MessageCircle className={cls} />
    case 'PAYMENT_RECEIVED':
    case 'SYSTEM':
      return <CheckCircle className={cls} />
    case 'DISPUTE_OPENED':
    case 'DISPUTE_RESOLVED':
      return <AlertCircle className={cls} />
    default:
      return <Bell className={cls} />
  }
}

function getNotificationUrl(
  type: NotificationType,
  data: Record<string, unknown> | null,
): string | null {
  switch (type) {
    case 'BOOKING_REQUEST':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
    case 'DISPUTE_OPENED':
    case 'DISPUTE_RESOLVED':
    case 'PAYMENT_RECEIVED':
      return typeof data?.bookingId === 'string'
        ? `/bookings/${data.bookingId}`
        : '/bookings'
    case 'REVIEW_RECEIVED':
      return typeof data?.bookingId === 'string'
        ? `/bookings/${data.bookingId}`
        : '/provider/dashboard'
    case 'MESSAGE_NEW':
      return typeof data?.conversationId === 'string'
        ? `/chat/${data.conversationId}`
        : '/chat'
    case 'SYSTEM':
      return null
    default:
      return null
  }
}

function getAriaLabel(type: NotificationType, title: string): string {
  switch (type) {
    case 'BOOKING_REQUEST':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
    case 'DISPUTE_OPENED':
    case 'DISPUTE_RESOLVED':
    case 'PAYMENT_RECEIVED':
    case 'REVIEW_RECEIVED':
      return `Go to booking: ${title}`
    case 'MESSAGE_NEW':
      return `Open message: ${title}`
    default:
      return title
  }
}

export default function NotificationRow({ notification }: NotificationRowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRead, setIsRead] = useState(notification.isRead)

  async function handleClick() {
    const url = getNotificationUrl(notification.type, notification.data)
    if (!isRead) {
      startTransition(async () => {
        await readNotification(notification.id)
        setIsRead(true)
      })
    }
    if (url) router.push(url)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={[
        'w-full text-left bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-3.5 transition-all duration-150 hover:bg-surface-container/30 cursor-pointer',
        isRead ? 'opacity-70' : '',
        isPending ? 'opacity-50' : '',
      ].join(' ')}
      aria-label={getAriaLabel(notification.type, notification.title)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={[
            'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
            isRead
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
                isRead ? 'text-on-surface-variant' : 'text-on-surface'
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
        {!isRead && (
          <span
            className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  )
}
