import { getServiceCategories, getMyProviderProfile } from '@/app/actions/booking'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddServiceForm from './AddServiceForm'
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Add a Service
        </h1>
        <p className="text-gray-600 mb-6">
          What service do you want to offer, {profile.displayName}?
        </p>

        {profile.services && profile.services.length > 0 && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Your current services:</p>
            {profile.services.map((s: ProviderServiceItem) => (
              <span key={s.id} className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mr-2 mb-1">
                {s.category?.name} — ₹{s.customRate || profile.baseRate}/{s.rateType?.toLowerCase() || 'hr'}
              </span>
            ))}
          </div>
        )}

        {availableCategories.length === 0 ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-medium">You offer all available services!</p>
            <a href="/provider/dashboard" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              Go to Dashboard →
            </a>
          </div>
        ) : (
          <AddServiceForm categories={availableCategories} />
        )}
      </div>
    </div>
  )
}
