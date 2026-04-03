import { requireAuthUser } from '@/lib/auth'
import { getMyFavorites } from '@/app/actions/favorite'
import Link from 'next/link'
import UnfavoriteButton from './UnfavoriteButton'
import { ProviderCard } from '@/components/ui/ProviderCard'
import type { ProviderListItem } from '@/types'

export default async function FavoritesPage() {
  await requireAuthUser()

  const favorites = await getMyFavorites()

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Frosted-glass header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center">
        <h1 className="font-headline font-bold text-base text-on-surface">
          Favorites
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-14">
        <p className="text-on-surface-variant font-body text-sm mt-4 mb-6">
          {favorites.length === 0
            ? 'Save providers you like for quick access.'
            : `${favorites.length} saved provider${favorites.length === 1 ? '' : 's'}`}
        </p>

        {favorites.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-8 text-center mt-4">
            <p className="text-on-surface font-body text-lg mb-2">No favorites yet</p>
            <p className="text-on-surface-variant font-body text-sm mb-6">
              Browse providers and save the ones you like.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-full font-body transition-opacity hover:opacity-90"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((provider: ProviderListItem) => (
              <div
                key={provider.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-5"
              >
                <div className="flex items-start gap-4">
                  {/* ProviderCard thumbnail — fixed width card */}
                  <div className="shrink-0">
                    <ProviderCard
                      providerId={provider.id}
                      name={provider.displayName}
                      role={provider.services[0]?.category.name ?? 'Service Provider'}
                      rating={provider.ratingAvg}
                      reviewCount={provider.ratingCount}
                      pricePerHour={provider.baseRate}
                      isVerified={provider.isVerified}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {provider.bio && (
                      <p className="text-on-surface-variant font-body text-sm line-clamp-3 mb-3">
                        {provider.bio}
                      </p>
                    )}

                    {provider.areas.length > 0 && (
                      <p className="text-on-surface-variant font-body text-xs mb-2">
                        📍 {provider.areas.map((a) => a.areaName).join(', ')}
                      </p>
                    )}

                    {provider.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {provider.services.map((service) => (
                          <span
                            key={service.id}
                            className="inline-flex items-center gap-1 text-xs bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded-full font-body"
                          >
                            {service.category.name}
                            {service.customRate != null && ` · ₹${service.customRate}`}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/provider/${provider.id}`}
                        className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-full font-body transition-opacity hover:opacity-90"
                      >
                        View Profile
                      </Link>
                      <UnfavoriteButton
                        providerId={provider.id}
                        providerName={provider.displayName}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
