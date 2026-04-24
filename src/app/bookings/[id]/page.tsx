import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, MessageCircle, CalendarDays, Clock, ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react'
import { requireAuthUser } from '@/lib/auth'
import { getBookingById } from '@/app/actions/booking'
import { Badge } from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import BookingActionButtons from '../_components/BookingActionButtons'
import StartWithOtpButton from '../_components/StartWithOtpButton'
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
  COMPLETED: 'Done',
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
    timeZone: 'Asia/Kolkata',
  })
}

function formatScheduledTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
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
  scheduledAt: Date | null
  otherPartyFirstName: string
  isRequester: boolean
}

function getStepHint(
  status: BookingStatus,
  scheduledAt: Date | null,
  otherPartyFirstName: string,
  isRequester: boolean,
): string | null {
  const scheduledStr = scheduledAt
    ? scheduledAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) +
      ' at ' + scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    : null

  if (isRequester) {
    switch (status) {
      case 'PENDING':      return `Waiting for ${otherPartyFirstName} to accept your request`
      case 'CONFIRMED':    return scheduledStr ? `${otherPartyFirstName} is scheduled for ${scheduledStr} — share your OTP when they arrive` : `${otherPartyFirstName} accepted — share your OTP when they arrive`
      case 'IN_PROGRESS':  return `${otherPartyFirstName} is working on it`
      case 'COMPLETED':    return 'All done! Rate your experience below'
      default:             return null
    }
  } else {
    switch (status) {
      case 'PENDING':      return 'Accept or decline this booking request'
      case 'CONFIRMED':    return scheduledStr ? `Scheduled for ${scheduledStr} — enter the customer OTP to start` : `Enter the customer OTP when you arrive to start the job`
      case 'IN_PROGRESS':  return `Job in progress — mark done when you finish`
      case 'COMPLETED':    return 'Job complete — waiting for payment'
      default:             return null
    }
  }
}

function StatusTimeline({ status, scheduledAt, otherPartyFirstName, isRequester }: TimelineProps) {
  const currentIdx = timelineIndex(status)
  const isCancelled = status === 'CANCELLED'
  const isDisputed = status === 'DISPUTED'
  const hint = getStepHint(status, scheduledAt, otherPartyFirstName, isRequester)

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
      {hint && !isCancelled && !isDisputed && (
        <p className="mt-3 text-xs text-on-surface-variant font-body leading-relaxed">
          {hint}
        </p>
      )}
    </Section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageParams {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new?: string }>
}

export default async function BookingDetailPage({ params, searchParams }: PageParams) {
  await requireAuthUser('/welcome')

  const { id } = await params
  const { new: isNew } = await searchParams
  const justCreated = isNew === '1'
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

  const isPaid = booking.paymentStatus === 'COMPLETED'

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
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
            {STATUS_LABEL[booking.status] ?? booking.status}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 pt-14 mt-4 space-y-3">

        {/* Booking confirmation banner — shown only on first redirect after creation */}
        {justCreated && (
          <section className="bg-primary-fixed rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-on-primary text-xs font-bold">&#10003;</span>
              </div>
              <p className="font-headline text-sm font-bold text-on-surface">
                Booking request sent!
              </p>
            </div>
            <p className="text-xs text-on-surface-variant font-body leading-relaxed">
              Your request has been sent to {booking.otherParty.name.split(' ')[0]}.
              They usually respond within 30 minutes. We&apos;ll notify you as soon as they confirm.
            </p>
            <p className="text-xs text-on-surface-variant/70 font-body mt-1.5">
              You can message them once they accept your booking.
            </p>
          </section>
        )}

        {/* Status timeline */}
        <StatusTimeline
          status={booking.status}
          scheduledAt={booking.scheduledAt}
          otherPartyFirstName={booking.otherParty.name.split(' ')[0]}
          isRequester={isRequester}
        />

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

        {/* Job code — shown to requester when booking is confirmed, waiting for provider to arrive */}
        {booking.startOtp && (
          <section className="bg-primary-fixed rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-on-primary-fixed shrink-0" />
              <h2 className="text-xs font-semibold text-on-primary-fixed font-body uppercase tracking-wide">
                Job Code
              </h2>
            </div>
            <p className="text-3xl font-bold tracking-[0.3em] text-on-primary-fixed font-headline">
              {booking.startOtp}
            </p>
            <p className="mt-1.5 text-xs text-on-primary-fixed font-body font-medium">
              Your safety code — share it with {booking.otherParty.name.split(' ')[0]} only when they arrive at your door.
            </p>
            <p className="mt-1 text-xs text-on-primary-fixed/70 font-body">
              This confirms the right person is here. They&apos;ll enter it in their app to start the job.
            </p>
          </section>
        )}

        {/* Other party */}
        <Section title={otherLabel}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-on-surface font-body text-sm">
              {booking.otherParty.name}
            </p>
            {booking.conversationId && (
              <Link
                href={`/chat/${booking.conversationId}`}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-body font-medium hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </Link>
            )}
          </div>
          {!booking.conversationId && (
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              Chat will be available once the booking is confirmed.
            </p>
          )}
        </Section>

        {/* Actions */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4">
          <h2 className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wide mb-3">
            Actions
          </h2>

          <BookingActionButtons bookingId={booking.id} actions={booking.actions} />

          {/* Disputed — direct to support */}
          {booking.status === 'DISPUTED' && (
            <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-error mt-0.5 shrink-0" />
                <p className="text-sm font-body text-on-surface-variant leading-relaxed">
                  This booking is under dispute. Our team will reach out within 24 hours. You can also contact us directly for faster resolution.
                </p>
              </div>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '919000000000'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-error text-on-error font-body font-semibold text-sm transition-opacity active:opacity-80"
              >
                Contact Support on WhatsApp
              </a>

            </div>
          )}

          {/* OTP job start — provider enters code from customer to begin the job */}
          {booking.actions.canStart && (
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <StartWithOtpButton bookingId={booking.id} />
            </div>
          )}

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
              <Link
                href={`/chat/${booking.conversationId}`}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-on-primary font-body font-semibold text-sm transition-opacity active:opacity-80"
              >
                <MessageCircle className="w-4 h-4" />
                Message {booking.otherParty.name.split(' ')[0]}
              </Link>
            </div>
          )}

          {/* Book Again — only for requester on completed bookings */}
          {isRequester && booking.status === 'COMPLETED' && booking.providerProfileId && (
            <div className="mt-3">
              <Link
                href={`/provider/${booking.providerProfileId}`}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-body font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-4 h-4" />
                Book {booking.otherParty.name.split(' ')[0]} again
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
              timeZone: 'Asia/Kolkata',
            })}
          </p>
          {booking.confirmedAt && (
            <p className="text-xs text-on-surface-variant/60 font-body">
              Confirmed on{' '}
              {booking.confirmedAt.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'Asia/Kolkata',
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
                timeZone: 'Asia/Kolkata',
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
                timeZone: 'Asia/Kolkata',
              })}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
