'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

type Status = 'online' | 'offline' | 'reconnected'

export default function OfflineIndicator() {
  const [status, setStatus] = useState<Status>('online')

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    const initialTimer = setTimeout(() => {
      if (!navigator.onLine) setStatus('offline')
    }, 0)

    function handleOnline() {
      setStatus('reconnected')
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => setStatus('online'), 3000)
    }
    function handleOffline() {
      setStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      clearTimeout(initialTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (status === 'online') return null

  const isOffline = status === 'offline'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-safe left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-md
        transition-all duration-300 animate-in slide-in-from-top-2 fade-in
        ${isOffline
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-green-50 text-green-800 border border-green-200'
        }`}
      style={{ top: 'max(12px, env(safe-area-inset-top))' }}
    >
      {isOffline ? (
        <><WifiOff size={12} aria-hidden /> No internet connection</>
      ) : (
        <><Wifi size={12} aria-hidden /> Back online</>
      )}
    </div>
  )
}
