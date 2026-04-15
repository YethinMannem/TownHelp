import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, MessageCircle, Phone, CalendarDays, Clock } from 'lucide-react'
import { requireAuthUser } from '@/lib/auth'
import { getBookingById } from '@/app/actions/booking'
import { Badge } from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import BookingActionButtons from '../_components/BookingActionButtons'
import ConfirmReceiptButton from '../_components/ConfirmReceiptButton'
import ReviewButton from '../_components/ReviewButton'
import PaymentCheckout from '@/components/PaymentCheckout'
import type { BookingStatus } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'pending',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
}

// Timeline steps in order (terminal states skip some)
const TIMELINE_STEPS: BookingStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatScheduledDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatScheduledTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// Returns the index a status sits at in the TIMELINE_STEPS array.
// CANCELLED and DISPUTED are terminal but don't map to a step index.
function timelineIndex(status: BookingStatus): number {
  const idx = TIMELINE_STEPS.indexOf(status)
  return idx // -1 when cancelled/disputed
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 space-y-2">
      <h2 className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  )
}

interface TimelineProps {
  status: BookingStatus
}

function StatusTimeline({ status }: TimelineProps) {
  const currentIdx = timelineIndex(status)
  const isCancelled = status === 'CANCELLED'
  const isDisputed = status === 'DISPUTED'

  return (
    <Section title="Booking journey">
      {(isCancelled || isDisputed) && (
        <div className="mb-3">
          <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'info'}>
            {STATUS_LABEL[status]}
          </Badge>
        </div>
      )}
      <div className="flex items-center gap-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const isPast = currentIdx > idx
          const isCurrent = currentIdx === idx && !isCancelled && !isDisputed
          const isFuture = currentIdx < idx || isCancelled || isDisputed

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    'w-3 h-3 rounded-full shrink-0 border-2',
                    isPast
                      ? 'bg-primary border-primary'
                      : isCurrent
                        ? 'bg-primary border-primary ring-2 ring-primary/30'
                        : 'bg-surface-container border-outline-variant',
                  ].join(' ')}
                />
                <span
                  className={[
                    'text-[10px] font-body text-center leading-tight whitespace-nowrap',
                    isFuture
                      ? 'text-on-surface-variant/50'
                      : 'text-on-surface font-semibold',
                  ].join(' ')}
                >
                  {STATUS_LABEL[step]}
                </span>
              </div>
              {/* Connector line (between dots, not after last) */}
              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className={[
                    'h-0.5 flex-1 mx-1 mb-4',
                    isPast ? 'bg-primary' : 'bg-outline-variant/30',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageParams {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: PageParams) {
  await requireAuthUser('/welcome')

  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) notFound()

  const isRequester = booking.role === 'requester'
  const otherLabel = isRequester ? 'Provider' : 'Customer'

  const showPayment =
    isRequester &&
    booking.status === 'COMPLETED' &&
    booking.paymentStatus === 'NONE' &&
    (booking.finalAmount !== null || booking.quotedRate !== null)

  const showPaymentPending = isRequester && booking.paymentStatus === 'PENDING'

  const showConfirmReceipt =
    !isRequester &&
    booking.status === 'COMPLETED' &&
    booking.paymentStatus === 'PENDING'

  const isPaid =
    (isRequester || !isRequester) && booking.paymentStatus === 'COMPLETED'

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <Link
          href="/bookings"
          className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-surface-container transition-colors"
          aria-label="Back to bookings"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-headline font-bold text-base text-on-surface truncate">
            #{booking.bookingNumber}
          </span>
          <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? 'info'}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 pt-14 mt-4 space-y-3">

        {/* Status timeline */}
        <StatusTimeline status={booking.status} />

        {/* Service info */}
        <Section title="Service">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-on-surface font-body">
              {booking.category.name}
            </p>
            {booking.quotedRate !== null && (
              <span className="text-sm font-semibold text-primary font-body">
                ₹{booking.quotedRate}
              </span>
            )}
          </div>
          {booking.finalAmount !== null &&
            booking.finalAmount !== booking.quotedRate && (
              <p className="text-xs text-on-surface-variant font-body mt-1">
                Final amount:{' '}
                <span className="font-semibold text-on-surface">
                  ₹{booking.finalAmount}
                </span>
              </p>
            )}
          {isPaid && (
            <div className="mt-2">
              <Badge variant="completed">Paid</Badge>
            </div>
          )}
        </Section>

        {/* Schedule */}
        {booking.scheduledAt && (
          <Section title="Schedule">
            <div className="flex items-start gap-2 text-sm text-on-surface font-body">
              <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{formatScheduledDate(booking.scheduledAt)}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-on-surface font-body">
              <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{formatScheduledTime(booking.scheduledAt)}</span>
            </div>
          </Section>
        )}

        {/* Address */}
        {booking.serviceAddress && (
          <Section title="Address">
            <div className="flex items-start gap-2 text-sm text-on-surface font-body">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{booking.serviceAddress}</span>
            </div>
          </Section>
        )}

        {/* Notes */}
        {booking.requesterNotes && (
          <Section title="Notes">
            <blockquote className="border-l-2 border-primary pl-3 text-sm text-on-surface-variant font-body italic">
              &quot;{booking.requesterNotes}&quot;
            </blockquote>
          </Section>
        )}

        {/* Other party */}
        <Section title={otherLabel}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-on-surface font-body text-sm">
                {booking.otherParty.name}
              </p>
              {booking.otherParty.phone && (
                <a
                  href={`tel:${booking.otherParty.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-body mt-1"
                >
                  <Phone className="w-3 h-3" />
                  {booking.otherParty.phone}
                </a>
              )}
            </div>
          </div>
        </Section>

        {/* Actions */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4">
          <h2 className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wide mb-3">
            Actions
          </h2>

          <BookingActionButtons bookingId={booking.id} actions={booking.actions} />

          {showPayment && (
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <PaymentCheckout
                bookingId={booking.id}
                amount={(booking.finalAmount ?? booking.quotedRate)!}
                bookingNumber={booking.bookingNumber}
              />
            </div>
          )}

          {showPaymentPending && (
            <p className="mt-3 text-xs text-on-surface-variant font-body">
              Payment submitted. Waiting for the provider to confirm receipt.
            </p>
          )}

          {showConfirmReceipt && (
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <ConfirmReceiptButton bookingId={booking.id} />
            </div>
          )}

          {isRequester && (
            <ReviewButton
              bookingId={booking.id}
              hasReview={booking.hasReview}
              isCompleted={booking.status === 'COMPLETED'}
            />
          )}

          {/* Chat */}
          {booking.conversationId && (
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <Link href={`/chat/${booking.conversationId}`}>
                <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-on-primary font-body font-semibold text-sm transition-opacity active:opacity-80">
                  <MessageCircle className="w-4 h-4" />
                  Message {booking.otherParty.name.split(' ')[0]}
                </button>
              </Link>
            </div>
          )}
        </section>

        {/* Booking meta */}
        <section className="px-1 pb-2 space-y-1">
          <p className="text-xs text-on-surface-variant/60 font-body">
            Booked on{' '}
            {booking.createdAt.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {booking.confirmedAt && (
            <p className="text-xs text-on-surface-variant/60 font-body">
              Confirmed on{' '}
              {booking.confirmedAt.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {booking.completedAt && (
            <p className="text-xs text-on-surface-variant/60 font-body">
              Completed on{' '}
              {booking.completedAt.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {booking.cancelledAt && (
            <p className="text-xs text-on-surface-variant/60 font-body">
              Cancelled on{' '}
              {booking.cancelledAt.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
