'use server'

import { requireAuthUser } from '@/lib/auth'
import {
  getNotifications as fetchNotifications,
  markAsRead as markNotificationRead,
  markAllAsRead as markAllNotificationsRead,
} from '@/services/notification.service'
import type { NotificationSummary } from '@/types'

export async function getMyNotifications(cursor?: string): Promise<NotificationSummary> {
  const user = await requireAuthUser()
  return fetchNotifications(user.id, { cursor })
}

export async function readNotification(notificationId: string): Promise<void> {
  const user = await requireAuthUser()
  await markNotificationRead(user.id, notificationId)
}

export async function readAllNotifications(): Promise<number> {
  const user = await requireAuthUser()
  return markAllNotificationsRead(user.id)
}
