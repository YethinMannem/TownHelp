import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import type { PushSubscription } from 'web-push'

let vapidReady = false
let vapidChecked = false

function getVapidContact(): string {
  const contact = process.env.VAPID_CONTACT_EMAIL
  if (!contact) return 'mailto:support@townhelp.app'
  return contact.startsWith('mailto:') ? contact : `mailto:${contact}`
}

function hasUsableVapidConfig(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  return Boolean(
    publicKey &&
    privateKey &&
    /^[A-Za-z0-9_-]+$/.test(publicKey) &&
    /^[A-Za-z0-9_-]+$/.test(privateKey)
  )
}

function ensureVapidDetails(): boolean {
  if (vapidChecked) return vapidReady
  vapidChecked = true

  if (!hasUsableVapidConfig()) {
    console.warn('[push] VAPID keys are missing or invalid; push delivery is disabled.')
    return false
  }

  try {
    webpush.setVapidDetails(
      getVapidContact(),
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )
    vapidReady = true
  } catch (error) {
    console.warn('[push] Failed to configure VAPID details; push delivery is disabled.', error)
    vapidReady = false
  }

  return vapidReady
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapidDetails()) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  })

  if (!user?.metadata || typeof user.metadata !== 'object' || Array.isArray(user.metadata)) {
    return
  }

  const meta = user.metadata as Record<string, unknown>
  const subscription = meta.pushSubscription

  if (!subscription || typeof subscription !== 'object') {
    return
  }

  try {
    await webpush.sendNotification(
      subscription as PushSubscription,
      JSON.stringify(payload),
    )
  } catch (error: unknown) {
    // 410 Gone or 404 Not Found — subscription is stale, remove it
    const status =
      error instanceof Error && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : null

    if (status === 410 || status === 404) {
      try {
        const { pushSubscription: _removed, ...remaining } = meta
        void _removed
        await prisma.user.update({
          where: { id: userId },
          data: { metadata: remaining as import('@/generated/prisma').Prisma.InputJsonValue },
        })
      } catch (cleanupError) {
        console.error('[sendPushToUser] failed to clear stale subscription:', cleanupError)
      }
    } else {
      console.error('[sendPushToUser] push delivery failed:', error)
    }
  }
}
