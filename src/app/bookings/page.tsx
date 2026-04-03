import { getMyBookings } from '@/app/actions/booking'
import Link from 'next/link'
import type { BookingAsRequester, BookingAsProvider } from '@/types'
import BookingActionButtons from './_components/BookingActionButtons'
import ReviewButton from './_components/ReviewButton'
import PaymentCheckout from '@/components/PaymentCheckout'
import { Badge } from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'pending',
}

export default async function BookingsPage() {
  const { asRequester, asProvider } = await getMyBookings()
  const hasBookings = asRequester.length > 0 || asProvider.length > 0

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Frosted-glass header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center">
        <h1 className="font-headline font-bold text-base text-on-surface">
          My Bookings
        </h1>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-14">

        {!hasBookings ? (
          <div className="mt-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-8 text-center">
            <p className="text-on-surface font-body text-lg mb-2">No bookings yet</p>
            <p className="text-on-surface-variant font-body text-sm mb-6">
              Find a provider and make your first booking!
            </p>
            <Link href="/browse">
              <Button variant="primary" size="sm">Browse Providers</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {asRequester.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3 font-body">
                  Services I Booked ({asRequester.length})
                </h2>
                <div className="space-y-3">
                  {asRequester.map((booking: BookingAsRequester) => (
                    <div
                      key={booking.id}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface font-body truncate">
                            {booking.category?.name || 'Service'}
                          </p>
                          <p className="text-sm text-on-surface-variant font-body">
                            Provider: {booking.provider?.displayName || 'N/A'}
                          </p>
                        </div>
                        <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? 'info'}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs text-on-surface-variant font-body">
                        <span>#{booking.bookingNumber}</span>
                        {booking.quotedRate && <span>₹{booking.quotedRate}</span>}
                        <span>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>

                      {booking.serviceAddress && (
                        <p className="mt-1 text-xs text-on-surface-variant font-body">
                          📍 {booking.serviceAddress}
                        </p>
                      )}
                      {booking.requesterNotes && (
                        <p className="mt-1 text-xs text-on-surface-variant font-body italic">
                          &quot;{booking.requesterNotes}&quot;
                        </p>
                      )}

                      <BookingActionButtons bookingId={booking.id} actions={booking.actions} />

                      {booking.status === 'COMPLETED' &&
                        booking.paymentStatus !== 'COMPLETED' &&
                        (booking.finalAmount || booking.quotedRate) && (
                          <div className="mt-3 pt-3 border-t border-outline-variant/20">
                            <PaymentCheckout
                              bookingId={booking.id}
                              amount={booking.finalAmount ?? booking.quotedRate!}
                              bookingNumber={booking.bookingNumber}
                            />
                          </div>
                        )}

                      {booking.paymentStatus === 'COMPLETED' && (
                        <div className="mt-2">
                          <Badge variant="completed">Paid</Badge>
                        </div>
                      )}

                      <ReviewButton
                        bookingId={booking.id}
                        hasReview={booking.hasReview}
                        isCompleted={booking.status === 'COMPLETED'}
                      />

                      {booking.provider?.userId && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/20">
                          <Link href={`/chat?userId=${booking.provider.userId}`}>
                            <Button variant="ghost" size="sm">Message</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {asProvider.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3 font-body">
                  Bookings I Received ({asProvider.length})
                </h2>
                <div className="space-y-3">
                  {asProvider.map((booking: BookingAsProvider) => (
                    <div
                      key={booking.id}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface font-body truncate">
                            {booking.category?.name || 'Service'}
                          </p>
                          <p className="text-sm text-on-surface-variant font-body">
                            From: {booking.requester?.fullName || 'Customer'}
                          </p>
                        </div>
                        <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? 'info'}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs text-on-surface-variant font-body">
                        <span>#{booking.bookingNumber}</span>
                        {booking.quotedRate && <span>₹{booking.quotedRate}</span>}
                        <span>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>

                      {booking.serviceAddress && (
                        <p className="mt-1 text-xs text-on-surface-variant font-body">
                          📍 {booking.serviceAddress}
                        </p>
                      )}

                      <BookingActionButtons bookingId={booking.id} actions={booking.actions} />

                      {booking.paymentStatus === 'COMPLETED' && (
                        <div className="mt-2">
                          <Badge variant="completed">Paid</Badge>
                        </div>
                      )}

                      {booking.requesterId && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/20">
                          <Link href={`/chat?userId=${booking.requesterId}`}>
                            <Button variant="ghost" size="sm">Message</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
