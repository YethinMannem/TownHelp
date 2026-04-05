'use server'

import { refresh, revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { isValidUUID } from '@/lib/validation'
import {
  getNotifications as fetchNotifications,
  getUnreadNotificationCount as fetchUnreadNotificationCount,
  markAsRead as markNotificationRead,
  markAllAsRead as markAllNotificationsRead,
} from '@/services/notification.service'
import type { NotificationSummary } from '@/types'

export async function getMyNotifications(cursor?: string): Promise<NotificationSummary> {
  const user = await requireAuthUser()
  return fetchNotifications(user.id, { cursor })
}

export async function getMyUnreadNotificationCount(): Promise<number> {
  const user = await requireAuthUser()
  return fetchUnreadNotificationCount(user.id)
}

export async function readNotification(notificationId: string): Promise<void> {
  if (!isValidUUID(notificationId)) return
  const user = await requireAuthUser()
  await markNotificationRead(user.id, notificationId)
  revalidatePath('/notifications')
  revalidatePath('/')
  refresh()
}

export async function readAllNotifications(): Promise<number> {
  const user = await requireAuthUser()
  const updated = await markAllNotificationsRead(user.id)
  revalidatePath('/notifications')
  revalidatePath('/')
  refresh()
  return updated
}
