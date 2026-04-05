import { requireAuthUser } from '@/lib/auth'
import { getMyFavorites } from '@/app/actions/favorite'
import Link from 'next/link'
import UnfavoriteButton from './UnfavoriteButton'
import type { ProviderListItem } from '@/types'
import { Heart, Star, MapPin } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-error-container text-on-error-container',
  'bg-[#cde5ff] text-[#073452]',
] as const

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

export default async function FavoritesPage() {
  await requireAuthUser()

  const favorites = await getMyFavorites()

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center">
        <div className="min-w-0">
          <h1 className="font-headline font-bold text-base text-on-surface truncate">
            Favorites
          </h1>
        </div>
        {favorites.length > 0 && (
          <span className="ml-2 shrink-0 text-sm text-on-surface-variant font-body">
            ({favorites.length})
          </span>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-14 mt-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-outline" />
            </div>
            <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
              No favorites yet
            </h2>
            <p className="text-sm text-on-surface-variant font-body max-w-xs mb-5">
              Browse providers and save the ones you like for quick access.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl font-body transition-opacity hover:opacity-90"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {favorites.map((provider: ProviderListItem) => (
              <div
                key={provider.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 transition-colors hover:bg-surface-container/30"
              >
                <div className="flex items-start gap-3">
                  <Link href={`/provider/${provider.id}`} className="flex flex-1 min-w-0 items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold font-headline shrink-0 ${getAvatarColor(provider.displayName)}`}
                    >
                      {getInitials(provider.displayName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface font-body text-[15px] truncate">
                            {provider.displayName}
                          </p>
                          <p className="text-xs text-on-surface-variant font-body mt-0.5">
                            {provider.services[0]?.category.name ?? 'Service Provider'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span className="text-sm font-semibold text-on-surface font-body">
                            {provider.ratingAvg.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {provider.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {provider.services.slice(0, 3).map((service) => (
                            <span
                              key={service.id}
                              className="text-[11px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-md font-body"
                            >
                              {service.category.name}
                              {service.customRate != null && ` · ₹${service.customRate}`}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant font-body">
                        <span className="font-semibold text-primary">
                          ₹{provider.baseRate}/hr
                        </span>
                        {provider.areas.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {provider.areas[0].areaName}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="shrink-0">
                    <UnfavoriteButton
                      providerId={provider.id}
                      providerName={provider.displayName}
                    />
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
