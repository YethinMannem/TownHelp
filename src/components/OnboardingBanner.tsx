'use client'

import { useState, useTransition, useRef } from 'react'
import { MapPin, X } from 'lucide-react'
import { updateProfile } from '@/app/actions/user'
import { useToast } from '@/components/ui/Toast'

interface OnboardingBannerProps {
  areas: string[]
  fullName: string
}

export default function OnboardingBanner({ areas, fullName }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  if (dismissed) return null

  function handleSubmit() {
    const location = inputRef.current?.value.trim() ?? ''
    if (!location) {
      toast('Please enter your neighborhood first.', 'error')
      inputRef.current?.focus()
      return
    }

    const formData = new FormData()
    formData.set('fullName', fullName)
    formData.set('locationLabel', location)

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        setDismissed(true)
      } else {
        toast(result.error ?? 'Could not save location. Please try again.', 'error')
      }
    })
  }

  return (
    <div
      role="region"
      aria-label="Set your neighborhood"
      className="relative bg-primary-fixed/30 border border-outline-variant/20 rounded-2xl px-4 py-5"
    >
      {/* Skip button */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Skip neighborhood setup"
        className="absolute top-3 right-3 p-1.5 rounded-full text-on-surface-variant hover:bg-outline-variant/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span
          aria-hidden="true"
          className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center"
        >
          <MapPin className="w-5 h-5 text-primary" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-headline text-sm font-bold text-on-surface leading-snug">
            Welcome to TownHelp!
          </p>
          <p className="mt-0.5 text-sm font-body text-on-surface-variant leading-snug">
            Set your neighborhood to discover services near you.
          </p>

          <div className="mt-3 flex gap-2">
            <div className="flex-1 min-w-0">
              <label htmlFor="onboarding-location" className="sr-only">
                Your neighborhood
              </label>
              <input
                ref={inputRef}
                id="onboarding-location"
                type="text"
                list="onboarding-areas"
                placeholder="e.g. Madhapur, Gachibowli"
                autoComplete="off"
                className="w-full px-3 py-2 rounded-xl bg-surface text-sm font-body text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
              <datalist id="onboarding-areas">
                {areas.map((area) => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="shrink-0 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium font-body transition-opacity disabled:opacity-60 hover:opacity-90 active:opacity-80"
            >
              {isPending ? 'Saving…' : 'Get started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
