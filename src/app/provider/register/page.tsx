'use client'

import { useState } from 'react'
import { createProviderProfile } from '@/app/actions/provider'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, BadgeCheck, IndianRupee, MapPinned, UserCircle } from 'lucide-react'
import LocationCapture from '@/components/ui/LocationCapture'

type FieldErrors = {
  displayName?: string
  baseRate?: string
  location?: string
  general?: string
}

function validate(formData: FormData): FieldErrors {
  const errors: FieldErrors = {}
  const displayName = (formData.get('displayName') as string)?.trim()
  const baseRate = parseFloat(formData.get('baseRate') as string)
  const lat = formData.get('lat') as string

  if (!displayName) errors.displayName = 'Display name is required'
  if (isNaN(baseRate) || baseRate < 50) errors.baseRate = 'Rate must be at least ₹50'
  if (baseRate > 10000) errors.baseRate = 'Rate cannot exceed ₹10,000'
  if (!lat) errors.location = 'Please share your location so customers can find you'
  return errors
}

export default function RegisterProviderPage() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    const errors = validate(formData)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)
    try {
      await createProviderProfile(formData)
    } catch (err: unknown) {
      setFieldErrors({ general: err instanceof Error ? err.message : 'Something went wrong' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0 lg:pl-60">
      <div className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors" aria-label="Back home">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline text-base font-semibold text-on-surface">
          Become a Provider
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-14 mt-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-headline text-xl font-bold text-on-surface">Set up your provider profile</h2>
                <p className="mt-1 text-sm text-on-surface-variant font-body leading-relaxed">
                  Add your service name, base rate, and work location so nearby customers can book you.
                </p>
              </div>
            </div>
          </div>

          <aside className="hidden lg:block rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
            <p className="section-label">Before you start</p>
            <div className="mt-4 space-y-3 text-sm font-body text-on-surface-variant">
              {[
                { icon: BadgeCheck, text: 'Use a name customers will recognize.' },
                { icon: IndianRupee, text: 'Set a practical starting rate.' },
                { icon: MapPinned, text: 'Share location for nearby matching.' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {fieldErrors.general && (
          <div className="mb-5 p-4 bg-error-container rounded-2xl text-on-error-container font-body text-sm">
            {fieldErrors.general}
          </div>
        )}

        <form action={handleSubmit} className="mt-5 max-w-xl rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-1">
            <Input
              id="displayName"
              name="displayName"
              label="Display Name *"
              required
              placeholder="e.g. Ravi's Electrical Services"
              hint="This is what customers will see"
            />
            {fieldErrors.displayName && (
              <p className="text-xs text-error font-body -mt-2">{fieldErrors.displayName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Input
              id="baseRate"
              name="baseRate"
              type="number"
              label="Base Rate (₹/hour) *"
              required
              min="50"
              max="10000"
              placeholder="e.g. 300"
              hint="₹50 – ₹10,000 per hour"
            />
            {fieldErrors.baseRate && (
              <p className="text-xs text-error font-body -mt-2">{fieldErrors.baseRate}</p>
            )}
          </div>

          <LocationCapture required error={fieldErrors.location} />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="bio"
              className="text-sm font-medium text-on-surface-variant font-body"
            >
              Short Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="Tell customers about your experience..."
              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-base font-body text-on-surface placeholder:text-outline bg-surface-container-lowest transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-2"
            size="lg"
          >
            {loading ? 'Creating Profile...' : 'Create Provider Profile →'}
          </Button>
        </form>
      </div>
    </div>
  )
}
