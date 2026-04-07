import { getMyBookings } from '@/app/actions/booking'
import Link from 'next/link'
import type { BookingAsRequester, BookingAsProvider } from '@/types'
import BookingActionButtons from './_components/BookingActionButtons'
import ReviewButton from './_components/ReviewButton'
import BookingTabs from './_components/BookingTabs'
import PaymentCheckout from '@/components/PaymentCheckout'
import { Badge } from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { requireAuthUser } from '@/lib/auth'
import { CalendarDays, MessageCircle, MapPin } from 'lucide-react'
import ConfirmReceiptButton from './_components/ConfirmReceiptButton'

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'pending',
}

function BookingCard({
  booking,
  variant,
}: {
  booking: BookingAsRequester | BookingAsProvider
  variant: 'requester' | 'provider'
}) {
  const otherParty = variant === 'requester'
    ? (booking as BookingAsRequester).provider?.displayName || 'Provider'
    : (booking as BookingAsProvider).requester?.fullName || 'Customer'

  const conversationId = booking.conversationId

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
      {/* Card header with status accent */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-on-surface font-body text-[15px]">
              {booking.category?.name || 'Service'}
            </p>
            <p className="text-sm text-on-surface-variant font-body mt-0.5">
              {variant === 'requester' ? 'Provider' : 'From'}: {otherParty}
            </p>
          </div>
          <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? 'info'}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-body bg-surface-container px-2 py-0.5 rounded-md">
            <CalendarDays className="w-3 h-3" />
            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
          <span className="text-xs text-on-surface-variant font-body bg-surface-container px-2 py-0.5 rounded-md">
            #{booking.bookingNumber}
          </span>
          {booking.quotedRate && (
            <span className="text-xs font-semibold text-primary font-body bg-primary-fixed/50 px-2 py-0.5 rounded-md">
              ₹{booking.quotedRate}
            </span>
          )}
        </div>

        {booking.serviceAddress && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-on-surface-variant font-body">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{booking.serviceAddress}</span>
          </p>
        )}

        {booking.requesterNotes && (
          <p className="mt-1.5 text-xs text-on-surface-variant font-body italic line-clamp-2">
            &quot;{booking.requesterNotes}&quot;
          </p>
        )}
      </div>

      {/* Actions section */}
      <div className="px-4 pb-4">
        <BookingActionButtons bookingId={booking.id} actions={booking.actions} />

        {/* Payment section (requester only) */}
        {variant === 'requester' && booking.status === 'COMPLETED' &&
          (booking as BookingAsRequester).paymentStatus === 'NONE' &&
          (booking.finalAmount || booking.quotedRate) && (
            <div className="mt-3 pt-3 border-t border-outline-variant/20">
              <PaymentCheckout
                bookingId={booking.id}
                amount={booking.finalAmount ?? booking.quotedRate!}
                bookingNumber={booking.bookingNumber}
              />
            </div>
          )}

        {variant === 'requester' && (booking as BookingAsRequester).paymentStatus === 'PENDING' && (
          <div className="mt-3 pt-3 border-t border-outline-variant/20">
            <p className="text-xs text-on-surface-variant font-body">
              Payment submitted. Waiting for the provider to confirm receipt.
            </p>
          </div>
        )}

        {variant === 'provider' && booking.status === 'COMPLETED' &&
          (booking as BookingAsProvider).paymentStatus === 'PENDING' && (
            <div className="mt-3 pt-3 border-t border-outline-variant/20">
              <ConfirmReceiptButton bookingId={booking.id} />
            </div>
          )}

        {/* Paid badge */}
        {((variant === 'requester' && (booking as BookingAsRequester).paymentStatus === 'COMPLETED') ||
          (variant === 'provider' && (booking as BookingAsProvider).paymentStatus === 'COMPLETED')) && (
          <div className="mt-2">
            <Badge variant="completed">Paid</Badge>
          </div>
        )}

        {/* Review (requester only) */}
        {variant === 'requester' && (
          <ReviewButton
            bookingId={booking.id}
            hasReview={(booking as BookingAsRequester).hasReview}
            isCompleted={booking.status === 'COMPLETED'}
          />
        )}

        {/* Message link */}
        {conversationId && (
          <div className="mt-3 pt-3 border-t border-outline-variant/20">
            <Link href={`/chat/${conversationId}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyBookings() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
        <CalendarDays className="w-8 h-8 text-outline" />
      </div>
      <p className="text-on-surface font-body text-base font-semibold mb-1">No bookings yet</p>
      <p className="text-on-surface-variant font-body text-sm mb-5 max-w-xs">
        Find a provider and make your first booking!
      </p>
      <Link href="/browse">
        <Button variant="primary" size="sm">Browse Providers</Button>
      </Link>
    </div>
  )
}

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'IN_PROGRESS'])

function splitBookings<T extends { status: string }>(bookings: T[]): { active: T[]; past: T[] } {
  const active: T[] = []
  const past: T[] = []
  for (const b of bookings) {
    if (ACTIVE_STATUSES.has(b.status)) {
      active.push(b)
    } else {
      past.push(b)
    }
  }
  return { active, past }
}

function BookingGrid<T extends BookingAsRequester | BookingAsProvider>({
  bookings,
  variant,
}: {
  bookings: T[]
  variant: 'requester' | 'provider'
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} variant={variant} />
      ))}
    </div>
  )
}

export default async function BookingsPage() {
  await requireAuthUser('/welcome')

  const { asRequester, asProvider } = await getMyBookings()
  const hasBookings = asRequester.length > 0 || asProvider.length > 0

  const requester = splitBookings(asRequester)
  const provider = splitBookings(asProvider)

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center">
        <h1 className="font-headline font-bold text-base text-on-surface">
          My Bookings
        </h1>
      </header>

      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 pt-14 mt-4">
        {!hasBookings ? (
          <EmptyBookings />
        ) : (
          <BookingTabs
            requesterCount={requester.active.length}
            providerCount={provider.active.length}
            requesterPastCount={requester.past.length}
            providerPastCount={provider.past.length}
            requesterContent={
              requester.active.length === 0 ? (
                <p className="text-on-surface-variant font-body text-sm text-center py-8">
                  No active bookings.
                </p>
              ) : (
                <BookingGrid bookings={requester.active} variant="requester" />
              )
            }
            providerContent={
              provider.active.length === 0 ? (
                <p className="text-on-surface-variant font-body text-sm text-center py-8">
                  No active bookings received.
                </p>
              ) : (
                <BookingGrid bookings={provider.active} variant="provider" />
              )
            }
            requesterPastContent={
              requester.past.length > 0 ? (
                <BookingGrid bookings={requester.past} variant="requester" />
              ) : undefined
            }
            providerPastContent={
              provider.past.length > 0 ? (
                <BookingGrid bookings={provider.past} variant="provider" />
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
