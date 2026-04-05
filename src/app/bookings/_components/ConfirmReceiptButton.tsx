'use client'

import { useTransition } from 'react'
import { confirmPaymentReceived } from '@/app/actions/booking'
import { Button } from '@/components/ui/Button'

interface ConfirmReceiptButtonProps {
  bookingId: string
}

export default function ConfirmReceiptButton({
  bookingId,
}: ConfirmReceiptButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm(): void {
    startTransition(async () => {
      const result = await confirmPaymentReceived(bookingId)
      if (!result.success) {
        alert(result.error ?? 'Failed to confirm payment receipt.')
      }
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600">
        The requester marked this booking as paid offline.
      </p>
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={isPending}
        onClick={handleConfirm}
      >
        {isPending ? 'Confirming...' : 'Confirm Payment Receipt'}
      </Button>
    </div>
  )
}
