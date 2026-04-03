'use client'

import { useTransition } from 'react'
import {
  confirmBooking,
  rejectBooking,
  startBooking,
  completeBooking,
  cancelBooking,
  disputeBooking,
} from '@/app/actions/booking'
import { Button } from '@/components/ui/Button'
import type { BookingActions } from '@/types'

interface BookingActionButtonsProps {
  bookingId: string
  actions: BookingActions
}

export default function BookingActionButtons({ bookingId, actions }: BookingActionButtonsProps) {
  const [isPending, startTransition] = useTransition()

  const hasAnyAction = Object.values(actions).some(Boolean)
  if (!hasAnyAction) return null

  function handleAction(action: () => Promise<unknown>): void {
    startTransition(async () => {
      const result = await action()
      if (result && typeof result === 'object' && 'error' in result) {
        alert((result as { error: string }).error)
      }
    })
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
          Confirm
        </Button>
      )}
      {actions.canReject && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => rejectBooking(bookingId))}
        >
          Reject
        </Button>
      )}
      {actions.canStart && (
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => startBooking(bookingId))}
        >
          Start
        </Button>
      )}
      {actions.canComplete && (
        <Button
          variant="primary"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => completeBooking(bookingId))}
        >
          Complete
        </Button>
      )}
      {actions.canCancel && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => cancelBooking(bookingId))}
        >
          Cancel
        </Button>
      )}
      {actions.canDispute && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(() => disputeBooking(bookingId))}
        >
          Dispute
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
