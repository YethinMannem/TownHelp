'use client'

import { useTransition } from 'react'
import { toggleAvailability, updateAvailabilityHours } from '@/app/actions/provider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wifi, WifiOff } from 'lucide-react'

interface AvailabilityFormProps {
  isAvailable: boolean
  availableFrom: string
  availableTo: string
}

export default function AvailabilityForm({
  isAvailable,
  availableFrom,
  availableTo,
}: AvailabilityFormProps) {
  const [togglePending, startToggle] = useTransition()
  const [hoursPending, startHours] = useTransition()

  function handleToggle() {
    startToggle(async () => {
      await toggleAvailability()
    })
  }

  function handleHoursSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const from = (form.elements.namedItem('availableFrom') as HTMLInputElement).value
    const to = (form.elements.namedItem('availableTo') as HTMLInputElement).value
    startHours(async () => {
      await updateAvailabilityHours(from, to)
    })
  }

  return (
    <div className="space-y-4">
      {/* Online / Offline toggle */}
      <section className="bg-surface-container rounded-2xl p-5">
        <h2 className="font-headline text-base font-semibold text-on-surface">Status</h2>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          When offline, customers cannot book you.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <span
            className={`flex items-center gap-1.5 text-sm font-body font-medium ${
              isAvailable ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            {isAvailable
              ? <><Wifi className="w-4 h-4" /> Online</>
              : <><WifiOff className="w-4 h-4" /> Offline</>
            }
          </span>

          <button
            type="button"
            onClick={handleToggle}
            disabled={togglePending}
            aria-label={isAvailable ? 'Go offline' : 'Go online'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${
              isAvailable ? 'bg-primary' : 'bg-outline-variant'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow transition-transform ${
                isAvailable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {togglePending && (
            <span className="font-body text-xs text-on-surface-variant">Saving...</span>
          )}
        </div>
      </section>

      {/* Working hours */}
      <section className="bg-surface-container rounded-2xl p-5">
        <h2 className="font-headline text-base font-semibold text-on-surface">Working Hours</h2>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Set the hours you are available each day.
        </p>

        <form onSubmit={handleHoursSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="availableFrom"
              name="availableFrom"
              type="time"
              label="From"
              defaultValue={availableFrom}
              required
            />

            <Input
              id="availableTo"
              name="availableTo"
              type="time"
              label="To"
              defaultValue={availableTo}
              required
            />
          </div>

          <Button
            type="submit"
            loading={hoursPending}
            disabled={hoursPending}
            className="w-full"
            size="lg"
          >
            {hoursPending ? 'Saving...' : 'Save Hours'}
          </Button>
        </form>
      </section>
    </div>
  )
}
