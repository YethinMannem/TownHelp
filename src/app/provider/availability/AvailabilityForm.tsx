'use client'

import { useTransition } from 'react'
import { toggleAvailability, updateAvailabilityHours } from '@/app/actions/provider'

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
    <div className="mt-6 space-y-6">
      {/* Online / Offline toggle */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800">Status</h2>
        <p className="text-sm text-gray-500 mt-1">
          When offline, customers cannot book you.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <span
            className={`text-sm font-medium ${
              isAvailable ? 'text-green-700' : 'text-gray-500'
            }`}
          >
            {isAvailable ? 'Online' : 'Offline'}
          </span>

          <button
            type="button"
            onClick={handleToggle}
            disabled={togglePending}
            aria-label={isAvailable ? 'Go offline' : 'Go online'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 ${
              isAvailable ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isAvailable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {togglePending && (
            <span className="text-xs text-gray-400">Saving...</span>
          )}
        </div>
      </section>

      {/* Working hours */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800">Working Hours</h2>
        <p className="text-sm text-gray-500 mt-1">
          Set the hours you are available each day.
        </p>

        <form onSubmit={handleHoursSubmit} className="mt-4 space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="availableFrom" className="text-sm font-medium text-gray-700">
              From
            </label>
            <input
              id="availableFrom"
              name="availableFrom"
              type="time"
              defaultValue={availableFrom}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="availableTo" className="text-sm font-medium text-gray-700">
              To
            </label>
            <input
              id="availableTo"
              name="availableTo"
              type="time"
              defaultValue={availableTo}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={hoursPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
          >
            {hoursPending ? 'Saving...' : 'Save Hours'}
          </button>
        </form>
      </section>
    </div>
  )
}
