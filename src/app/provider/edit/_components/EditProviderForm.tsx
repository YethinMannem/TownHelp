'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProviderProfile } from '@/app/actions/provider'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { User, FileText, IndianRupee, CheckCircle } from 'lucide-react'

interface EditProviderFormProps {
  displayName: string
  bio: string | null
  baseRate: number
  isAvailable: boolean
}

export default function EditProviderForm({
  displayName,
  bio,
  baseRate,
  isAvailable: initialIsAvailable,
}: EditProviderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState(initialIsAvailable)
  const { toast } = useToast()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    // Sync the controlled toggle state into FormData
    formData.set('isAvailable', available ? 'true' : 'false')
    startTransition(async () => {
      const result = await updateProviderProfile(formData)
      if (result.success) {
        toast('Profile updated!', 'success')
        router.push('/provider/dashboard')
      } else {
        const msg = result.error ?? 'Something went wrong.'
        setError(msg)
        toast(msg, 'error')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-5 space-y-4"
    >
      <h2 className="font-headline text-sm font-bold text-on-surface">Edit Profile</h2>

      {/* Display name */}
      <div className="space-y-1.5">
        <label
          htmlFor="displayName"
          className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant font-body"
        >
          <User className="w-3.5 h-3.5" />
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          required
          maxLength={100}
          placeholder="Your display name"
          className="w-full px-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label
          htmlFor="bio"
          className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant font-body"
        >
          <FileText className="w-3.5 h-3.5" />
          Bio
          <span className="text-on-surface-variant/50 font-normal">(optional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ''}
          maxLength={500}
          rows={3}
          placeholder="Tell customers about yourself and your experience…"
          className="w-full px-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Base rate */}
      <div className="space-y-1.5">
        <label
          htmlFor="baseRate"
          className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant font-body"
        >
          <IndianRupee className="w-3.5 h-3.5" />
          Base rate (per hour)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-body text-on-surface-variant pointer-events-none select-none">
            ₹
          </span>
          <input
            id="baseRate"
            name="baseRate"
            type="number"
            defaultValue={baseRate}
            required
            min={1}
            step="0.01"
            placeholder="0"
            className="w-full pl-8 pr-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Availability toggle */}
      <div className="flex items-center justify-between gap-3 py-1">
        <div>
          <p className="font-body text-sm font-medium text-on-surface">
            Available for new bookings
          </p>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            Turn off to pause incoming requests
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          onClick={() => setAvailable((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            available ? 'bg-primary' : 'bg-outline-variant'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform ${
              available ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
          <span className="sr-only">{available ? 'Available' : 'Unavailable'}</span>
        </button>
        {/* Hidden input so FormData always carries isAvailable */}
        <input type="hidden" name="isAvailable" value={available ? 'true' : 'false'} />
      </div>

      {/* Inline error */}
      {error && (
        <p role="alert" className="text-xs text-error font-body">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="sm" loading={isPending}>
          <CheckCircle className="w-4 h-4" />
          Save changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => router.push('/provider/dashboard')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
