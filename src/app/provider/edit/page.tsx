import { requireAuthUser } from '@/lib/auth'
import { getMyProviderProfile } from '@/app/actions/booking'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EditProviderForm from './_components/EditProviderForm'

export default async function ProviderEditPage() {
  await requireAuthUser()

  const profile = await getMyProviderProfile()

  if (!profile) {
    redirect('/provider/register')
  }

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center justify-between">
        <Link
          href="/provider/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline text-base font-bold text-on-surface">
          Edit Profile
        </h1>
        <div className="w-9" />
      </header>

      <div className="max-w-lg mx-auto px-4 lg:px-8 pt-14 mt-4">
        <EditProviderForm
          displayName={profile.displayName}
          bio={profile.bio}
          baseRate={profile.baseRate}
          isAvailable={profile.isAvailable}
        />
      </div>
    </div>
  )
}
