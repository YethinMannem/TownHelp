'use client'

import { useState } from 'react'
import { createProviderProfile } from '@/app/actions/provider'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UserCircle } from 'lucide-react'
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
        <Link href="/" className="text-sm font-body text-primary hover:underline">
          ← Home
        </Link>
        <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
          <UserCircle className="w-4 h-4 text-primary" />
        </div>
        <h1 className="font-headline text-base font-semibold text-on-surface">
          Become a Provider
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-14 mt-6">
        {fieldErrors.general && (
          <div className="mb-5 p-4 bg-error-container rounded-2xl text-on-error-container font-body text-sm">
            {fieldErrors.general}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
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
