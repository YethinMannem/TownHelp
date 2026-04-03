import { getServiceCategories, getMyProviderProfile } from '@/app/actions/booking'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddServiceForm from './AddServiceForm'
import Link from 'next/link'
import { Layers } from 'lucide-react'
import type { ProviderServiceItem } from '@/types'

export default async function AddServicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getMyProviderProfile()
  if (!profile) {
    redirect('/provider/register')
  }

  const categories = await getServiceCategories()

  const existingCategoryIds = profile.services?.map((s: ProviderServiceItem) => s.category?.id) || []
  const availableCategories = categories.filter(
    (c) => !existingCategoryIds.includes(c.id)
  )

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Frosted-glass fixed header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <Link href="/provider/dashboard" className="text-sm font-body text-primary hover:underline">
          ← Dashboard
        </Link>
        <div className="w-8 h-8 rounded-xl bg-secondary-fixed flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-secondary" />
        </div>
        <h1 className="font-headline text-base font-semibold text-on-surface">
          Add a Service
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-14 mt-5">
        {/* Current services chips */}
        {profile.services && profile.services.length > 0 && (
          <div className="mb-5 p-4 bg-surface-container rounded-2xl">
            <p className="font-body text-sm font-semibold text-on-surface mb-2">
              Your current services
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s: ProviderServiceItem) => (
                <span
                  key={s.id}
                  className="text-xs font-body bg-primary-fixed text-primary px-2.5 py-1 rounded-full"
                >
                  {s.category?.name} — ₹{s.customRate || profile.baseRate}/{s.rateType?.toLowerCase() || 'hr'}
                </span>
              ))}
            </div>
          </div>
        )}

        {availableCategories.length === 0 ? (
          <div className="p-6 bg-surface-container rounded-2xl text-center">
            <p className="font-body font-semibold text-on-surface mb-2">
              You offer all available services!
            </p>
            <Link
              href="/provider/dashboard"
              className="font-body text-sm text-primary hover:underline"
            >
              Go to Dashboard →
            </Link>
          </div>
        ) : (
          <AddServiceForm categories={availableCategories} />
        )}
      </div>
    </div>
  )
}
