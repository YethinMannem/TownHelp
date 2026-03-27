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
import type { BookingActions } from '@/types'

// Temporary test component — Meghana will replace with styled version
interface BookingActionButtonsProps {
  bookingId: string
  actions: BookingActions
}

const BUTTON_STYLES: Record<string, string> = {
  confirm: 'bg-green-600 hover:bg-green-700 text-white',
  reject: 'bg-red-600 hover:bg-red-700 text-white',
  start: 'bg-purple-600 hover:bg-purple-700 text-white',
  complete: 'bg-blue-600 hover:bg-blue-700 text-white',
  cancel: 'bg-gray-600 hover:bg-gray-700 text-white',
  dispute: 'bg-orange-600 hover:bg-orange-700 text-white',
}

export default function BookingActionButtons({ bookingId, actions }: BookingActionButtonsProps) {
  const [isPending, startTransition] = useTransition()

  const hasAnyAction = Object.values(actions).some(Boolean)
  if (!hasAnyAction) return null

  function handleAction(action: () => Promise<unknown>) {
    startTransition(async () => {
      const result = await action()
      if (result && typeof result === 'object' && 'error' in result) {
        alert((result as { error: string }).error)
      }
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
      {actions.canConfirm && (
        <button
          disabled={isPending}
          onClick={() => handleAction(() => confirmBooking(bookingId))}
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${BUTTON_STYLES.confirm} disabled:opacity-50`}
        >
          Confirm
        </button>
      )}
      {actions.canReject && (
        <button
          disabled={isPending}
          onClick={() => handleAction(() => rejectBooking(bookingId))}
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${BUTTON_STYLES.reject} disabled:opacity-50`}
        >
          Reject
        </button>
      )}
      {actions.canStart && (
        <button
          disabled={isPending}
          onClick={() => handleAction(() => startBooking(bookingId))}
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${BUTTON_STYLES.start} disabled:opacity-50`}
        >
          Start
        </button>
      )}
      {actions.canComplete && (
        <button
          disabled={isPending}
          onClick={() => handleAction(() => completeBooking(bookingId))}
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${BUTTON_STYLES.complete} disabled:opacity-50`}
        >
          Complete
        </button>
      )}
      {actions.canCancel && (
        <button
          disabled={isPending}
          onClick={() => handleAction(() => cancelBooking(bookingId))}
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${BUTTON_STYLES.cancel} disabled:opacity-50`}
        >
          Cancel
        </button>
      )}
      {actions.canDispute && (
        <button
          disabled={isPending}
          onClick={() => handleAction(() => disputeBooking(bookingId))}
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${BUTTON_STYLES.dispute} disabled:opacity-50`}
        >
          Dispute
        </button>
      )}
      {isPending && <span className="text-xs text-gray-400 self-center">Updating...</span>}
    </div>
  )
}
