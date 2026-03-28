import { getMyProviderProfile } from '@/app/actions/booking'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ProviderServiceItem, ServiceAreaItem } from '@/types'

export default async function ProviderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getMyProviderProfile()

  if (!profile) {
    redirect('/provider/register')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Home
        </Link>

        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.displayName}</h1>
              {profile.bio && (
                <p className="text-gray-600 text-sm mt-1">{profile.bio}</p>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              profile.isVerified
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {profile.isVerified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>

          <div className="mt-4 flex gap-4 text-sm text-gray-600">
            <span>⭐ {profile.ratingAvg.toFixed(1)} ({profile.ratingCount} reviews)</span>
            <span>₹{profile.baseRate}/hr base</span>
          </div>

          {profile.areas && profile.areas.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              📍 {profile.areas.map((a: ServiceAreaItem) => a.areaName).join(', ')}
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Your Services</h2>
            <Link
              href="/provider/add-service"
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Service
            </Link>
          </div>

          {(!profile.services || profile.services.length === 0) ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-500 mb-3">No services listed yet</p>
              <Link
                href="/provider/add-service"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Add Your First Service
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.services.map((service: ProviderServiceItem) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-800">{service.category?.name}</p>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{service.customRate || profile.baseRate}
                    </p>
                    <p className="text-xs text-gray-500">
                      /{service.rateType?.toLowerCase() || 'hr'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/provider/availability"
            className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Availability Settings
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Session 4 — Provider Dashboard
        </p>
      </div>
    </div>
  )
}
