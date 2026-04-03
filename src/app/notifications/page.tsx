import { requireAuthUser } from '@/lib/auth'
import { getMyNotifications } from '@/app/actions/notification'
import MarkAllReadButton from './_components/MarkAllReadButton'
import NotificationRow from './_components/NotificationRow'

export default async function NotificationsPage() {
  await requireAuthUser()

  const { notifications, unreadCount } = await getMyNotifications()

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Frosted-glass header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-headline font-bold text-base text-on-surface">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full font-body">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </header>

      <div className="max-w-lg mx-auto px-4 pt-14">
        {notifications.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-8 text-center mt-8">
            <p className="text-on-surface font-body text-lg mb-2">No notifications yet</p>
            <p className="text-on-surface-variant font-body text-sm">
              You will be notified about bookings, messages, and updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
