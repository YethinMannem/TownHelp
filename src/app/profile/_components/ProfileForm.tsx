'use client'

import { useTransition, useState } from 'react'
import { updateProfile } from '@/app/actions/user'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { User, MapPin, CheckCircle } from 'lucide-react'
import SignOutButton from '@/components/SignOutButton'
import LocationInput from '@/components/LocationInput'

interface ProfileFormProps {
  fullName: string
  locationLabel: string
  areas: string[]
}

export default function ProfileForm({
  fullName,
  locationLabel,
}: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setSaved(false)
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        setSaved(true)
        toast('Profile saved!', 'success')
      } else {
        setError(result.error ?? 'Something went wrong.')
        toast(result.error ?? 'Something went wrong.', 'error')
      }
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-5 space-y-4">
        <h2 className="font-headline text-sm font-bold text-on-surface">Edit Profile</h2>

        {/* Full name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant font-body">
            <User className="w-3.5 h-3.5" />
            Full name
          </label>
          <input
            name="fullName"
            type="text"
            defaultValue={fullName}
            required
            minLength={2}
            maxLength={100}
            placeholder="Your full name"
            className="w-full px-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant font-body">
            <MapPin className="w-3.5 h-3.5" />
            Neighborhood / area
          </label>
          <LocationInput
            name="locationLabel"
            defaultValue={locationLabel}
            placeholder="e.g. Madhapur, Kondapur…"
          />
          <p className="text-xs text-on-surface-variant font-body">
            Shown in your home screen header. Helps match you with local providers.
          </p>
        </div>

        {/* Inline error */}
        {error && (
          <p className="text-xs text-error font-body">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="sm" loading={isPending}>
            Save changes
          </Button>
          {saved && !isPending && (
            <span className="flex items-center gap-1 text-xs text-primary font-body">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>
      </form>

      {/* Sign out */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4">
        <SignOutButton />
      </div>
    </div>
  )
}
