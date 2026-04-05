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
  const viewer = await getViewerContext()
  const providerHref = viewer.providerProfileId ? '/provider/dashboard' : '/provider/register'
  const unreadMessagesCount = viewer.user
    ? await getUnreadMessageCountForViewer(viewer.user.id, viewer.providerProfileId)
    : 0

  return (
    <html lang="en">
      <body className="min-h-full bg-surface text-on-surface font-body">
        {children}
        {viewer.user && (
          <BottomNav
            providerHref={providerHref}
            unreadMessagesCount={unreadMessagesCount}
          />
        )}
      </body>
    </html>
  )
}
