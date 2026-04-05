import { requireAuthUser } from '@/lib/auth'
import { getMyNotifications } from '@/app/actions/notification'
import Link from 'next/link'
import MarkAllReadButton from './_components/MarkAllReadButton'
import NotificationRow from './_components/NotificationRow'
import { ArrowLeft, BellOff } from 'lucide-react'

export default async function NotificationsPage() {
  await requireAuthUser()

  const { notifications, unreadCount } = await getMyNotifications()

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </Link>
          <h1 className="font-headline font-bold text-base text-on-surface truncate">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 bg-primary text-on-primary text-[11px] font-bold rounded-full font-body">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="shrink-0">
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-14">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
              <BellOff className="w-8 h-8 text-outline" />
            </div>
            <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
              No notifications yet
            </h2>
            <p className="text-sm text-on-surface-variant font-body max-w-xs">
              You&apos;ll be notified about bookings, messages, and updates here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 mt-4">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
