'use client'

import { useTransition, useState } from 'react'
import {
  confirmBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
  disputeBooking,
} from '@/app/actions/booking'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { BookingActions } from '@/types'

interface BookingActionButtonsProps {
  bookingId: string
  actions: BookingActions
}

export default function BookingActionButtons({ bookingId, actions }: BookingActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmingDone, setConfirmingDone] = useState(false)
  const [confirmation, setConfirmation] = useState<{
    title: string
    description: string
    confirmLabel: string
    variant: 'ghost' | 'destructive'
    action: () => Promise<unknown>
  } | null>(null)
  const { toast } = useToast()

  const hasAnyAction = Object.values(actions).some(Boolean)
  if (!hasAnyAction) return null

  function handleAction(action: () => Promise<unknown>): void {
    startTransition(async () => {
      const result = await action()
      if (result && typeof result === 'object' && 'error' in result) {
        toast((result as { error: string }).error, 'error')
      }
    })
  }

  function handleMarkDone(): void {
    setConfirmingDone(false)
    handleAction(() => completeBooking(bookingId))
  }

  function handleConfirmedAction(): void {
    if (!confirmation) return
    const action = confirmation.action
    setConfirmation(null)
    handleAction(action)
  }

  return (
    <div className="mt-3 pt-3 border-t border-outline-variant/20 flex flex-wrap gap-2">
      {actions.canConfirm && (
        <Button
          variant="primary"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => confirmBooking(bookingId))}
        >
          Accept
        </Button>
      )}
      {actions.canReject && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => setConfirmation({
            title: 'Decline this request?',
            description: 'The booking will be cancelled and the customer will be notified.',
            confirmLabel: 'Decline request',
            variant: 'destructive',
            action: () => rejectBooking(bookingId),
          })}
        >
          Decline
        </Button>
      )}
      {actions.canComplete && !confirmingDone && (
        <Button
          variant="primary"
          size="sm"
          disabled={isPending}
          onClick={() => setConfirmingDone(true)}
        >
          Mark as Done
        </Button>
      )}
      {actions.canComplete && confirmingDone && (
        <div className="w-full bg-surface-container rounded-xl px-3 py-2.5 space-y-2">
          <p className="text-xs font-body text-on-surface">
            Mark this job as complete? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={handleMarkDone}
            >
              Yes, mark done
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmingDone(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {actions.canCancel && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => setConfirmation({
            title: 'Cancel this booking?',
            description: 'This changes the booking status for both you and the other person.',
            confirmLabel: 'Cancel booking',
            variant: 'ghost',
            action: () => cancelBooking(bookingId),
          })}
        >
          Cancel Booking
        </Button>
      )}
      {actions.canDispute && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => setConfirmation({
            title: 'Report a problem?',
            description: 'This opens a dispute on the booking. Use this when the job or payment needs help.',
            confirmLabel: 'Report problem',
            variant: 'destructive',
            action: () => disputeBooking(bookingId),
          })}
        >
          Report Problem
        </Button>
      )}
      {actions.awaitingPayment && (
        <span className="text-xs px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant font-body self-center">
          Awaiting payment from requester
        </span>
      )}
      {isPending && (
        <span className="text-xs text-on-surface-variant font-body self-center">Updating…</span>
      )}
      {confirmation && (
        <div className="w-full bg-surface-container rounded-xl px-3 py-2.5 space-y-2">
          <div>
            <p className="text-xs font-body font-semibold text-on-surface">{confirmation.title}</p>
            <p className="text-xs font-body text-on-surface-variant mt-0.5">{confirmation.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={confirmation.variant}
              size="sm"
              disabled={isPending}
              onClick={handleConfirmedAction}
            >
              {confirmation.confirmLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmation(null)}
            >
              Keep booking
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
