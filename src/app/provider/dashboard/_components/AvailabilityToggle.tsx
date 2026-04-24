'use client'

import { useState, useTransition } from 'react'
import { toggleAvailability } from '@/app/actions/provider'
import { useToast } from '@/components/ui/Toast'

interface AvailabilityToggleProps {
  isAvailable: boolean
}

export default function AvailabilityToggle({ isAvailable }: AvailabilityToggleProps) {
  const [available, setAvailable] = useState(isAvailable)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleAvailability()
        setAvailable((prev) => !prev)
        toast(
          available ? 'You are now offline. Customers cannot book you.' : 'You are now online and accepting bookings.',
          'success'
        )
      } catch {
        toast('Could not update availability. Try again.', 'error')
      }
    })
  }

  return (
    <div className={`rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-4 transition-colors ${
      available
        ? 'bg-primary-fixed/20 border-primary/20'
        : 'bg-surface-container border-outline-variant/20'
    }`}>
      <div>
        <p className="font-body font-semibold text-on-surface text-sm">
          {available ? 'You are Online' : 'You are Offline'}
        </p>
        <p className="font-body text-xs text-on-surface-variant mt-0.5">
          {available
            ? 'Customers can see and book you right now.'
            : 'Turn on to start receiving bookings.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={available}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${
          available ? 'bg-primary' : 'bg-outline/30'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
            available ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
