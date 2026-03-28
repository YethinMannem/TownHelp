import { requireAuthUser } from '@/lib/auth'
import { getMyNotifications } from '@/app/actions/notification'
import Link from 'next/link'
import MarkAllReadButton from './_components/MarkAllReadButton'
import NotificationRow from './_components/NotificationRow'

export default async function NotificationsPage() {
  await requireAuthUser()

  const { notifications, unreadCount } = await getMyNotifications()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Home
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-lg mb-2">No notifications yet</p>
            <p className="text-gray-400 text-sm">
              You will be notified about bookings, messages, and updates here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
