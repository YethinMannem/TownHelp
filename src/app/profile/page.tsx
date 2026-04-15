import { requireAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServiceAreas } from '@/app/actions/booking'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ProfileForm from './_components/ProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile — TownHelp',
}

export default async function ProfilePage() {
  const authUser = await requireAuthUser()

  const [dbUser, areas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id, deletedAt: null },
      select: {
        fullName: true,
        email: true,
        phone: true,
        metadata: true,
        createdAt: true,
      },
    }),
    getServiceAreas(),
  ])

  if (!dbUser) {
    // Should never happen if requireAuthUser passed
    return null
  }

  const meta =
    dbUser.metadata &&
    typeof dbUser.metadata === 'object' &&
    !Array.isArray(dbUser.metadata)
      ? (dbUser.metadata as Record<string, unknown>)
      : {}

  const locationLabel =
    typeof meta.locationLabel === 'string' ? meta.locationLabel : ''

  const memberSince = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(dbUser.createdAt)

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline text-base font-bold text-on-surface">Profile</h1>
      </header>

      <div className="pt-14 px-4 lg:px-8 max-w-xl mx-auto mt-6 space-y-5">
        {/* Account info */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-3">
          <p className="text-xs text-on-surface-variant font-body mb-0.5">Account</p>
          <p className="text-sm font-body text-on-surface">
            {dbUser.email ?? dbUser.phone ?? '—'}
          </p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Member since {memberSince}
          </p>
        </div>

        {/* Editable profile form */}
        <ProfileForm
          fullName={dbUser.fullName}
          locationLabel={locationLabel}
          areas={areas}
        />
      </div>
    </div>
  )
}
