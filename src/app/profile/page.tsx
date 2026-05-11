import { requireAuthUser, getViewerContext } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LayoutGrid, Briefcase, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import ProfileForm from './_components/ProfileForm'
import SignOutButton from '@/components/SignOutButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account — TownHelp',
}

export default async function ProfilePage() {
  const authUser = await requireAuthUser()

  const [dbUser, viewer] = await Promise.all([
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
    getViewerContext(),
  ])

  if (!dbUser) {
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
  const locationLat =
    typeof meta.locationLat === 'number' && Number.isFinite(meta.locationLat)
      ? meta.locationLat
      : null
  const locationLng =
    typeof meta.locationLng === 'number' && Number.isFinite(meta.locationLng)
      ? meta.locationLng
      : null

  const memberSince = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(dbUser.createdAt)

  const isProvider = !!viewer.providerProfileId

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center">
        <h1 className="font-headline text-base font-bold text-on-surface">Account</h1>
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
          locationLat={locationLat}
          locationLng={locationLng}
        />

        {/* Provider section */}
        <div>
          <p className="text-xs font-body font-semibold text-on-surface-variant uppercase tracking-wide px-1 mb-2">
            Provider
          </p>
          {isProvider ? (
            <Link
              href="/provider/dashboard"
              className="flex items-center gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-fixed shrink-0">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-on-surface">Provider Dashboard</p>
                <p className="text-xs font-body text-on-surface-variant mt-0.5">Manage your bookings and services</p>
              </div>
              <span className="text-on-surface-variant" aria-hidden="true">›</span>
            </Link>
          ) : (
            <Link
              href="/provider/register"
              className="flex items-center gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-fixed shrink-0">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-on-surface">Earn with TownHelp</p>
                <p className="text-xs font-body text-on-surface-variant mt-0.5">Become a verified provider and earn from home</p>
              </div>
              <span className="text-on-surface-variant" aria-hidden="true">›</span>
            </Link>
          )}
        </div>

        {/* Help & Support section */}
        <div>
          <p className="text-xs font-body font-semibold text-on-surface-variant uppercase tracking-wide px-1 mb-2">
            Support
          </p>
          <Link
            href="/help"
            className="flex items-center gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 hover:bg-surface-container transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container shrink-0">
              <HelpCircle className="w-5 h-5 text-on-surface-variant" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-semibold text-on-surface">Help &amp; Support</p>
              <p className="text-xs font-body text-on-surface-variant mt-0.5">FAQs, cancellation policy, contact us</p>
            </div>
            <span className="text-on-surface-variant" aria-hidden="true">›</span>
          </Link>
        </div>

        {/* Sign out */}
        <div className="pb-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
