'use server'

import { prisma } from '@/lib/prisma'
import type { NotificationItem, NotificationSummary } from '@/types'

const DEFAULT_LIMIT = 20

/**
 * Fetch a user's notifications (most recent first) with unread count.
 */
export async function getNotifications(
  userId: string,
  options?: { limit?: number; cursor?: string }
): Promise<NotificationSummary> {
  const limit = options?.limit ?? DEFAULT_LIMIT

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(options?.cursor && {
        skip: 1,
        cursor: { id: options.cursor },
      }),
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        isRead: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ])

  return {
    notifications: notifications.map((n) => ({
      ...n,
      data: n.data as Record<string, unknown> | null,
    })),
    unreadCount,
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
}

/**
 * Mark all unread notifications as read for a user.
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  return result.count
}
