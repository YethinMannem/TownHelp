import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import './globals.css'
import BottomNav from '@/components/layout/BottomNav'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import PushSubscribeButton from '@/components/PushSubscribeButton'
import InstallPrompt from '@/components/InstallPrompt'
import OfflineIndicator from '@/components/OfflineIndicator'
import { ToastProvider } from '@/components/ui/Toast'
import { getViewerContext } from '@/lib/auth'
import { getUnreadMessageCountForViewer } from '@/services/chat.service'

// All iOS device sizes we generate splash screens for.
// Format: [logicalWidth, logicalHeight, devicePixelRatio, mediaQuery]
const SPLASH_SCREENS = [
  [430, 932, 3, '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)'],   // iPhone 16 Plus / 15 Pro Max / 14 Pro Max
  [393, 852, 3, '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)'],   // iPhone 16 Pro / 15 Pro / 15 / 14 Pro
  [428, 926, 3, '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)'],   // iPhone 14 Plus / 13 Pro Max
  [390, 844, 3, '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)'],   // iPhone 14 / 13 Pro / 13 / 12
  [375, 812, 3, '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)'],   // iPhone 13 mini / X / XS / 11 Pro
  [414, 896, 3, '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)'],   // iPhone 11 Pro Max / XS Max
  [414, 896, 2, '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)'],   // iPhone 11 / XR
  [375, 667, 2, '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)'],   // iPhone SE 2nd/3rd / 8
  [414, 736, 3, '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)'],   // iPhone 8 Plus
  [320, 568, 2, '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)'],   // iPhone SE 1st gen
  [1024, 1366, 2, '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)'], // iPad Pro 12.9"
  [834, 1194, 2, '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)'],  // iPad Pro 11"
  [820, 1180, 2, '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)'],  // iPad Air 5th gen
  [810, 1080, 2, '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)'],  // iPad 9th/10th gen
  [744, 1133, 2, '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2)'],  // iPad mini 6th gen
] as const

export const metadata: Metadata = {
  title: 'TownHelp',
  description: 'Neighborhood services, simplified. Find verified local service providers in your neighbourhood.',
  manifest: '/manifest.webmanifest',
  applicationName: 'TownHelp',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TownHelp',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'color-scheme': 'light',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4e644f',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()

  let viewer: Awaited<ReturnType<typeof getViewerContext>> | null = null
  let unreadMessagesCount = 0

  try {
    viewer = await getViewerContext()

    if (viewer.user) {
      try {
        unreadMessagesCount = await getUnreadMessageCountForViewer(
          viewer.user.id,
          viewer.providerProfileId
        )
      } catch (error) {
        console.error('Failed to fetch unread message count:', error)
      }
    }
  } catch (error) {
    console.error('Failed to load viewer context:', error)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : ''

  return (
    <html lang="en">
      <head>
        {/* Preconnect to Supabase so first API call is faster */}
        {supabaseHostname && (
          <>
            <link rel="preconnect" href={`https://${supabaseHostname}`} />
            <link rel="dns-prefetch" href={`https://${supabaseHostname}`} />
          </>
        )}
        {/* Apple splash screens — generated on demand via /splash/[slug] */}
        {SPLASH_SCREENS.map(([w, h, dpr, mq]) => (
          <link
            key={`${w}x${h}@${dpr}x`}
            rel="apple-touch-startup-image"
            media={`screen and ${mq} and (orientation: portrait)`}
            href={`/splash/${w}x${h}@${dpr}x.png`}
          />
        ))}
      </head>
      <body className="min-h-full bg-surface text-on-surface font-body">
        <ToastProvider>
          <ServiceWorkerRegistration />
          <OfflineIndicator />
          <InstallPrompt />
          {viewer?.user && <PushSubscribeButton />}
          {children}
          {viewer?.user && (
            <BottomNav
              unreadMessagesCount={unreadMessagesCount}
            />
          )}
        </ToastProvider>
      </body>
    </html>
  )
}
