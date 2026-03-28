import { requireAuthUser } from '@/lib/auth'
import { getMyFavorites } from '@/app/actions/favorite'
import Link from 'next/link'
import UnfavoriteButton from './UnfavoriteButton'
import { CATEGORY_ICONS } from '@/lib/constants'
import type { ProviderListItem, ProviderServiceItem } from '@/types'

export default async function FavoritesPage() {
  await requireAuthUser()

  const favorites = await getMyFavorites()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Home
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">My Favorites</h1>
        <p className="text-gray-600 mb-6">
          {favorites.length === 0
            ? 'Save providers you like for quick access.'
            : `${favorites.length} saved provider${favorites.length === 1 ? '' : 's'}`}
        </p>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-lg mb-2">No favorites yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Browse providers and save the ones you like.
            </p>
            <Link
              href="/browse"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((provider: ProviderListItem) => (
              <div
                key={provider.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/provider/${provider.id}`}
                      className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors"
                    >
                      {provider.displayName}
                    </Link>
                    {provider.bio && (
                      <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{provider.bio}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg text-gray-900">&#8377;{provider.baseRate}</p>
                    <p className="text-xs text-gray-500">base rate</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <span>&#9733; {provider.ratingAvg.toFixed(1)} ({provider.ratingCount})</span>
                  {provider.isVerified && (
                    <span className="text-green-600 font-medium">&#10003; Verified</span>
                  )}
                  {provider.areas.length > 0 && (
                    <span>&#128205; {provider.areas[0].areaName}</span>
                  )}
                </div>

                {provider.areas.length > 1 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {provider.areas.slice(1).map((area) => (
                      <span
                        key={`${area.areaName}-${area.city}`}
                        className="text-xs text-gray-400"
                      >
                        {area.areaName}
                      </span>
                    ))}
                  </div>
                )}

                {provider.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {provider.services.map((service: ProviderServiceItem) => (
                      <span
                        key={service.id}
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        {CATEGORY_ICONS[service.category.slug] || '\uD83D\uDCCB'}
                        {service.category.name}
                        {service.customRate != null && ` \u00B7 \u20B9${service.customRate}`}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/provider/${provider.id}`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Profile
                  </Link>
                  <UnfavoriteButton
                    providerId={provider.id}
                    providerName={provider.displayName}
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
