'use client'

import { useEffect, useState } from 'react'
import { X, HousePlus, Share, MoreVertical } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'townhelp-install-dismissed-at'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const SHOW_DELAY_MS = 20_000 // show after 20s of engagement

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosGuide, setIosGuide] = useState(false)

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Respect cooldown after previous dismissal
    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isAndroid = /android/i.test(navigator.userAgent)
    let timer: ReturnType<typeof setTimeout> | null = null

    if (isIOS) {
      timer = setTimeout(() => {
        setIosGuide(true)
        setVisible(true)
      }, SHOW_DELAY_MS)
      return () => {
        if (timer) clearTimeout(timer)
      }
    }

    if (!isAndroid) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      setPrompt(null)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible || (!prompt && !iosGuide)) return null

  return (
    <div
      role="dialog"
      aria-label="Add TownHelp to your home screen"
      className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl bg-white border border-black/[0.06] shadow-xl p-4 flex items-center gap-3
        animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="w-11 h-11 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center">
        <HousePlus size={20} className="text-white" aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface leading-tight">Add to Home Screen</p>
        {iosGuide ? (
          <p className="text-xs text-on-surface/55 mt-0.5 leading-snug">
            Tap <Share size={12} className="inline -mt-0.5" aria-hidden /> Share, then Add to Home Screen
          </p>
        ) : (
          <p className="text-xs text-on-surface/55 mt-0.5 leading-snug">
            Get quick access to bookings &amp; services
          </p>
        )}
      </div>

      {iosGuide ? (
        <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
          <MoreVertical size={17} aria-hidden />
        </div>
      ) : (
        <button
          onClick={handleInstall}
          className="flex-shrink-0 bg-primary text-white text-sm font-semibold px-3.5 py-2 rounded-xl"
        >
          Add
        </button>
      )}

      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="flex-shrink-0 -mr-1 p-1 text-on-surface/30 hover:text-on-surface/60 transition-colors"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}
