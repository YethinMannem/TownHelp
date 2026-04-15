'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { savePushSubscription, removePushSubscription } from '@/app/actions/push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const array = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i)
  }
  return array.buffer
}

export default function PushSubscribeButton(): React.ReactElement | null {
  const [supported, setSupported] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    if (Notification.permission === 'denied') {
      setPermissionDenied(true)
      return
    }

    setSupported(true)

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => {
        if (existing) setSubscribed(true)
      })
      .catch((err) => console.error('[PushSubscribeButton] getSubscription:', err))
  }, [])

  async function handleToggle(): Promise<void> {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready

      if (subscribed) {
        const existing = await registration.pushManager.getSubscription()
        if (existing) await existing.unsubscribe()
        await removePushSubscription()
        setSubscribed(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission === 'denied') {
          setPermissionDenied(true)
          setSupported(false)
          return
        }
        if (permission !== 'granted') return

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        const result = await savePushSubscription(subscription.toJSON())
        if (result.success) {
          setSubscribed(true)
        } else {
          console.error('[PushSubscribeButton] savePushSubscription failed:', result.error)
        }
      }
    } catch (error) {
      console.error('[PushSubscribeButton] toggle error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!supported || permissionDenied) return null

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={subscribed ? 'Disable notifications' : 'Enable notifications'}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        text-on-surface/70 hover:text-on-surface hover:bg-surface-variant disabled:opacity-50"
    >
      <Bell
        size={18}
        className={subscribed ? 'fill-primary text-primary' : ''}
        aria-hidden
      />
      <span>{subscribed ? 'Notifications on' : 'Enable notifications'}</span>
    </button>
  )
}
