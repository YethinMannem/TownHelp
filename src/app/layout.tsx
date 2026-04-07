import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/layout/BottomNav'
import { getViewerContext } from '@/lib/auth'
import { getUnreadMessageCountForViewer } from '@/services/chat.service'

export const metadata: Metadata = {
  title: 'TownHelp',
  description: 'Neighborhood services, simplified.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let viewer: Awaited<ReturnType<typeof getViewerContext>> | null = null
  let providerHref = '/provider/register'
  let unreadMessagesCount = 0

  try {
    viewer = await getViewerContext()
    providerHref = viewer.providerProfileId ? '/provider/dashboard' : '/provider/register'

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

  return (
    <html lang="en">
      <body className="min-h-full bg-surface text-on-surface font-body">
        {children}
        {viewer?.user && (
          <BottomNav
            providerHref={providerHref}
            unreadMessagesCount={unreadMessagesCount}
          />
        )}
      </body>
    </html>
  )
}
