import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, BadgeCheck, Briefcase, Clock } from 'lucide-react'
import { requireAuthUser } from '@/lib/auth'
import { getProviderById, getWeeklyAvailability } from '@/app/actions/provider'
import { isFavorited } from '@/app/actions/favorite'
import { getProviderReviews } from '@/app/actions/review'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import FavoriteButton from './FavoriteButton'
import BookButton from '@/app/browse/BookButton'
import VerificationInfo from './VerificationInfo'
import type { Metadata } from 'next'
import type { ReviewItem } from '@/types'

const AVATAR_COLORS = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-error-container text-on-error-container',
  'bg-tertiary-fixed text-on-tertiary-fixed',
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

function rateLabel(rateType: string | null): string {
  switch (rateType) {
    case 'HOURLY': return '/hr'
    case 'PER_VISIT': return '/visit'
    case 'PER_KG': return '/kg'
    case 'FIXED': return ' fixed'
    default: return ''
  }
}

interface ProviderPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { id } = await params
  const provider = await getProviderById(id)

  if (!provider) {
    return { title: 'Provider Not Found — TownHelp' }
  }

  const primaryService = provider.services[0]?.category.name ?? 'Service Provider'
  return {
    title: `${provider.displayName} — ${primaryService} | TownHelp`,
    description: provider.bio
      ?? `Book ${provider.displayName} for ${primaryService} services on TownHelp.`,
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const authUser = await requireAuthUser()

  const { id } = await params
  const provider = await getProviderById(id)
  if (!provider) notFound()

  const [favorited, reviews, { slots: availabilitySlots }] = await Promise.all([
    isFavorited(id),
    getProviderReviews(provider.userId),
    getWeeklyAvailability(id),
  ])

  const name = provider.displayName
  const firstName = name.split(' ')[0]
  const rating = provider.ratingAvg
  const reviewCount = provider.ratingCount
  const isOwnProfile = provider.userId === authUser.id
  const canBook = !isOwnProfile && provider.isAvailable && provider.services.length > 0

  return (
    <div className="min-h-screen bg-surface pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-8 lg:pl-60">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/browse"
          aria-label="Back to browse"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <span className="font-headline font-bold text-base text-on-surface truncate">
          Provider Profile
        </span>
      </header>

      <div className="pt-14">
        {/* Hero avatar — shorter on mobile, side on desktop */}
        <div
          className={cn(
            'w-full h-40 lg:h-48 flex items-center justify-center text-5xl lg:text-6xl font-bold font-headline select-none',
            getAvatarColor(name)
          )}
          aria-hidden="true"
        >
          {getInitials(name)}
        </div>

        <div className="px-4 lg:px-8 py-5 space-y-5 max-w-4xl mx-auto">
          {/* Name + badges */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline text-xl font-extrabold text-on-surface">
                {name}
              </h1>
              {!provider.isAvailable && (
                <Badge variant="pending">Unavailable</Badge>
              )}
            </div>

            {/* Verification badges — clickable with expansion */}
            <VerificationInfo
              isVerified={provider.isVerified}
              isBackgroundChecked={provider.isBackgroundChecked}
            />

            {provider.services.length > 0 && (
              <p className="mt-1 text-sm text-on-surface-variant font-body">
                {provider.services[0].category.name}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-semibold text-on-surface font-body">
                  {(Number(rating ?? 0)).toFixed(1)}
                </span>
                <span className="text-sm text-on-surface-variant font-body">
                  ({reviewCount})
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-on-surface-variant font-body">
                <Briefcase className="w-3.5 h-3.5" />
                {provider.completedBookings > 0 ? (
                  <span>{provider.completedBookings} jobs done</span>
                ) : (
                  <span>New provider</span>
                )}
              </div>
            </div>
          </div>

          {/* Bio — always shown */}
          <div>
            <h2 className="font-headline text-sm font-bold text-on-surface mb-2">
              About
            </h2>
            <p className="text-sm text-on-surface-variant font-body leading-relaxed italic">
              {provider.bio ?? `${firstName} hasn't added a bio yet. Feel free to message them after booking.`}
            </p>
          </div>

          {/* Services */}
          {provider.services.length > 0 && (
            <div>
              <h2 className="font-headline text-sm font-bold text-on-surface mb-2.5">
                Services offered
              </h2>
              <div className="flex flex-col gap-2">
                {provider.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-surface-container rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface font-body">
                        {service.category.name}
                      </p>
                      {service.description && (
                        <p className="text-xs text-on-surface-variant font-body mt-0.5">
                          {service.description}
                        </p>
                      )}
                    </div>
                    {service.customRate !== null && (
                      <span className="shrink-0 text-sm font-semibold text-primary font-body self-start sm:self-auto">
                        ₹{service.customRate}
                        <span className="text-xs font-normal text-on-surface-variant">
                          {rateLabel(service.rateType)}
                        </span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service areas */}
          {provider.areas.length > 0 && (
            <div>
              <h2 className="font-headline text-sm font-bold text-on-surface mb-2.5">
                Service areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {provider.areas.map((area) => (
                  <div
                    key={area.areaName}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium font-body',
                      area.isPrimary
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-surface-container text-on-surface-variant'
                    )}
                  >
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{area.areaName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly availability */}
          {availabilitySlots.some((s) => s.isActive) && (
            <div>
              <h2 className="font-headline text-sm font-bold text-on-surface mb-2.5">
                Availability
              </h2>
              <div className="flex flex-col gap-1.5">
                {availabilitySlots
                  .filter((s) => s.isActive)
                  .map((slot) => (
                    <div
                      key={slot.dayOfWeek}
                      className="flex items-center gap-2 text-sm font-body"
                    >
                      <Clock className="w-3.5 h-3.5 text-outline shrink-0" />
                      <span className="w-20 font-medium text-on-surface">{slot.dayName}</span>
                      <span className="text-on-surface-variant">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="font-headline text-sm font-bold text-on-surface mb-2.5">
              Reviews
              {reviews.length > 0 && (
                <span className="ml-1.5 text-sm font-normal text-on-surface-variant font-body">
                  ({reviews.length})
                </span>
              )}
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-sm font-semibold text-on-surface font-body">New on TownHelp</p>
                <p className="text-xs text-on-surface-variant font-body mt-1 leading-relaxed">
                  {firstName} recently joined TownHelp and hasn&apos;t received reviews yet.
                  All new providers are ID-verified before their first booking.
                </p>
                {provider.isVerified && (
                  <p className="text-xs text-primary font-semibold font-body mt-2">
                    ID Verified ✓ — identity confirmed by TownHelp
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {(reviews as ReviewItem[]).map((review) => (
                  <div
                    key={review.id}
                    className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-on-surface font-body">
                          {review.reviewerName}
                        </p>
                        <p className="text-xs text-on-surface-variant font-body mt-0.5">
                          {review.categoryName} &middot;{' '}
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary/80 font-body font-medium mt-0.5">
                          <BadgeCheck className="w-3 h-3" />
                          Verified booking
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3.5 h-3.5',
                              i < review.rating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-outline-variant'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-on-surface-variant font-body leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom actions — above BottomNav on mobile, at bottom on desktop */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-60 right-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 lg:px-8 py-3 max-w-4xl mx-auto">
          <FavoriteButton providerId={provider.id} initialFavorited={favorited} />
          <div className="flex-1 flex flex-col gap-1.5">
            {canBook && (
              <p className="text-[10px] text-on-surface-variant/60 font-body text-center">
                Chat is unlocked after booking. Free cancellation up to 2 hrs before.
              </p>
            )}
            <div className="flex items-center gap-2">
            {canBook ? (
              <BookButton
                providerId={provider.id}
                providerName={provider.displayName}
                services={provider.services}
                baseRate={provider.baseRate}
              />
            ) : (
              <div
                className="flex-1 w-full rounded-xl px-4 py-3 text-center text-sm font-medium font-body border bg-surface-container text-on-surface-variant border-outline-variant/30"
              >
                {isOwnProfile
                  ? 'This is your profile'
                  : !provider.isAvailable
                  ? 'Currently unavailable for bookings'
                  : 'No active services available to book'}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
