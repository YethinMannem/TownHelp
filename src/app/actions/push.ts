'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { requireAuthUser } from '@/lib/auth'

export async function savePushSubscription(
  subscription: PushSubscriptionJSON,
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await requireAuthUser()

    const current = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { metadata: true },
    })

    const existingMeta =
      current?.metadata &&
      typeof current.metadata === 'object' &&
      !Array.isArray(current.metadata)
        ? (current.metadata as Record<string, unknown>)
        : {}

    const newMeta: Record<string, unknown> = {
      ...existingMeta,
      pushSubscription: subscription,
    }

    await prisma.user.update({
      where: { id: authUser.id },
      data: { metadata: newMeta as Prisma.InputJsonValue },
    })

    return { success: true }
  } catch (error) {
    console.error('[savePushSubscription]:', error)
    return { success: false, error: 'Failed to save push subscription.' }
  }
}

export async function removePushSubscription(): Promise<{ success: boolean }> {
  try {
    const authUser = await requireAuthUser()

    const current = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { metadata: true },
    })

    const existingMeta =
      current?.metadata &&
      typeof current.metadata === 'object' &&
      !Array.isArray(current.metadata)
        ? (current.metadata as Record<string, unknown>)
        : {}

    const { pushSubscription: _removed, ...remaining } = existingMeta
    void _removed

    await prisma.user.update({
      where: { id: authUser.id },
      data: { metadata: remaining as Prisma.InputJsonValue },
    })

    return { success: true }
  } catch (error) {
    console.error('[removePushSubscription]:', error)
    return { success: false }
  }
}
