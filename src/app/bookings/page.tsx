import { getMyBookings } from '@/app/actions/booking'
import Link from 'next/link'
import type { BookingAsRequester, BookingAsProvider } from '@/types'
import BookingActionButtons from './_components/BookingActionButtons'
import ReviewButton from './_components/ReviewButton'
import PaymentCheckout from '@/components/PaymentCheckout'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-orange-100 text-orange-800',
}

export default async function BookingsPage() {
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
                  {asRequester.map((booking: BookingAsRequester) => (
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
                            Provider: {booking.provider?.displayName || 'N/A'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>#{booking.bookingNumber}</span>
                        {booking.quotedRate && <span>₹{booking.quotedRate}</span>}
                        <span>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      {booking.serviceAddress && (
                        <p className="mt-1 text-xs text-gray-500">📍 {booking.serviceAddress}</p>
                      )}
                      {booking.requesterNotes && (
                        <p className="mt-1 text-xs text-gray-500 italic">&quot;{booking.requesterNotes}&quot;</p>
                      )}
                      <BookingActionButtons bookingId={booking.id} actions={booking.actions} />
                      {booking.status === 'COMPLETED' && booking.paymentStatus !== 'COMPLETED' && (booking.finalAmount || booking.quotedRate) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <PaymentCheckout
                            bookingId={booking.id}
                            amount={booking.finalAmount ?? booking.quotedRate!}
                            bookingNumber={booking.bookingNumber}
                          />
                        </div>
                      )}
                      {booking.paymentStatus === 'COMPLETED' && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                            Paid
                          </span>
                        </div>
                      )}
                      <ReviewButton
                        bookingId={booking.id}
                        hasReview={booking.hasReview}
                        isCompleted={booking.status === 'COMPLETED'}
                      />
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
                  {asProvider.map((booking: BookingAsProvider) => (
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
                            From: {booking.requester?.fullName || 'Customer'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>#{booking.bookingNumber}</span>
                        {booking.quotedRate && <span>₹{booking.quotedRate}</span>}
                        <span>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      {booking.serviceAddress && (
                        <p className="mt-1 text-xs text-gray-500">📍 {booking.serviceAddress}</p>
                      )}
                      <BookingActionButtons bookingId={booking.id} actions={booking.actions} />
                      {booking.paymentStatus === 'COMPLETED' && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                            Paid
                          </span>
                        </div>
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
