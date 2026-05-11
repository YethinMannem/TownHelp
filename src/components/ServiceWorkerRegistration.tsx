'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return

    let updateInterval: ReturnType<typeof setInterval> | null = null
    let reloading = false

    function handleControllerChange() {
      if (!reloading) {
        reloading = true
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
      // Periodically check for new SW versions (every hour)
      updateInterval = setInterval(() => registration.update(), 60 * 60 * 1000)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          // New SW installed and waiting — tell it to skip waiting immediately.
          // The controllerchange listener below will reload the page once it takes over.
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })
    }).catch((err) => {
      console.error('[SW] Registration failed:', err)
    })

    return () => {
      if (updateInterval) clearInterval(updateInterval)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  return null
}
