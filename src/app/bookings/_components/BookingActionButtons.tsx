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
          onClick={() => handleAction(() => rejectBooking(bookingId))}
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
          onClick={() => handleAction(() => cancelBooking(bookingId))}
        >
          Cancel Booking
        </Button>
      )}
      {actions.canDispute && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => disputeBooking(bookingId))}
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
    </div>
  )
}
