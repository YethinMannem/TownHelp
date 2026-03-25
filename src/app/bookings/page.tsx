import { getMyBookings } from '@/app/actions/booking'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-gray-100 text-gray-800',
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { asRequester, asProvider } = await getMyBookings()
  const hasBookings = asRequester.length > 0 || asProvider.length > 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Home
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">
          My Bookings
        </h1>

        {!hasBookings ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-lg mb-2">No bookings yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Find a provider and make your first booking!
            </p>
            <Link
              href="/browse"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {asRequester.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Services I Booked ({asRequester.length})
                </h2>
                <div className="space-y-3">
                  {asRequester.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.category?.name || 'Service'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Provider: {booking.provider?.display_name || 'N/A'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>#{booking.booking_number}</span>
                        {booking.quoted_rate && <span>₹{Number(booking.quoted_rate)}</span>}
                        <span>{new Date(booking.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      {booking.service_address && (
                        <p className="mt-1 text-xs text-gray-500">📍 {booking.service_address}</p>
                      )}
                      {booking.requester_notes && (
                        <p className="mt-1 text-xs text-gray-500 italic">"{booking.requester_notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {asProvider.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Bookings I Received ({asProvider.length})
                </h2>
                <div className="space-y-3">
                  {asProvider.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.category?.name || 'Service'}
                          </p>
                          <p className="text-sm text-gray-600">
                            From: {booking.requester?.full_name || 'Customer'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>#{booking.booking_number}</span>
                        {booking.quoted_rate && <span>₹{Number(booking.quoted_rate)}</span>}
                        <span>{new Date(booking.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      {booking.service_address && (
                        <p className="mt-1 text-xs text-gray-500">📍 {booking.service_address}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          Session 4 — Booking Loop
        </p>
      </div>
    </div>
  )
}
