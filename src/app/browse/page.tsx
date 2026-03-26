import { getServiceCategories, getProviders } from '@/app/actions/booking'
import Link from 'next/link'
import BookButton from './BookButton'
import { CATEGORY_ICONS } from '@/lib/constants'
import type { ServiceCategoryItem, ProviderListItem, ProviderServiceItem } from '@/types'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const categorySlug = params.category || undefined

  const [categories, providers] = await Promise.all([
    getServiceCategories(),
    getProviders(categorySlug),
  ])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Home
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Find a Service Provider
        </h1>
        <p className="text-gray-600 mb-6">
          Browse available providers in Hyderabad
        </p>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <Link
            href="/browse"
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !categorySlug
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            All
          </Link>
          {categories.map((cat: ServiceCategoryItem) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categorySlug === cat.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {CATEGORY_ICONS[cat.slug] || '📋'} {cat.name}
            </Link>
          ))}
        </div>

        {(!providers || providers.length === 0) ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-lg mb-2">No providers found</p>
            <p className="text-gray-400 text-sm">
              {categorySlug
                ? 'Try a different category or check back later.'
                : 'Be the first to offer services!'}
            </p>
            <Link
              href="/provider/register"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Become a Provider
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider: ProviderListItem) => (
              <div
                key={provider.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {provider.displayName}
                    </h3>
                    {provider.bio && (
                      <p className="text-gray-600 text-sm mt-0.5">{provider.bio}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      ₹{provider.baseRate}
                    </p>
                    <p className="text-xs text-gray-500">base rate</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <span>⭐ {provider.ratingAvg.toFixed(1)} ({provider.ratingCount})</span>
                  {provider.isVerified && (
                    <span className="text-green-600 font-medium">✓ Verified</span>
                  )}
                  {provider.areas && provider.areas.length > 0 && (
                    <span>📍 {provider.areas[0].areaName}</span>
                  )}
                </div>

                {provider.services && provider.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {provider.services.map((service: ProviderServiceItem) => (
                      <span
                        key={service.id}
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        {CATEGORY_ICONS[service.category?.slug] || '📋'}
                        {service.category?.name}
                        {service.customRate && ` · ₹${service.customRate}`}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <BookButton
                    providerId={provider.id}
                    providerName={provider.displayName}
                    services={provider.services || []}
                    baseRate={provider.baseRate}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
