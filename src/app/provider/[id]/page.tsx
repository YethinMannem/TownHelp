import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin } from 'lucide-react'
import { requireAuthUser } from '@/lib/auth'
import { getProviderById } from '@/app/actions/provider'
import { isFavorited } from '@/app/actions/favorite'
import { getProviderReviews } from '@/app/actions/review'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import FavoriteButton from './FavoriteButton'
import type { ReviewItem } from '@/types'

// ─── Avatar helpers (same palette as ProviderCard) ───────────────────────────

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

function rateLabel(rateType: string | null): string {
  switch (rateType) {
    case 'HOURLY':
      return '/hr'
    case 'PER_VISIT':
      return '/visit'
    case 'PER_KG':
      return '/kg'
    case 'FIXED':
      return ' fixed'
    default:
      return ''
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ProviderPageProps {
  params: Promise<{ id: string }>
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  await requireAuthUser()

  const { id } = await params
  const provider = await getProviderById(id)
  if (!provider) notFound()

  const [favorited, reviews] = await Promise.all([
    isFavorited(id),
    getProviderReviews(provider.userId),
  ])

  const name = provider.displayName
  const rating = provider.ratingAvg
  const reviewCount = provider.ratingCount

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <Link
          href="/browse"
          aria-label="Back to browse"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <span className="font-headline font-bold text-base text-on-surface">
          Provider Profile
        </span>
      </header>

      <div className="pt-14">
        {/* Hero avatar */}
        <div
          className={cn(
            'w-full h-52 flex items-center justify-center text-6xl font-bold font-headline select-none',
            getAvatarColor(name)
          )}
          aria-hidden="true"
        >
          {getInitials(name)}
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Name + status */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline text-2xl font-extrabold text-on-surface">
                {name}
              </h1>
              {provider.isVerified && (
                <Badge variant="verified">✓ Verified</Badge>
              )}
              {!provider.isAvailable && (
                <Badge variant="pending">Unavailable</Badge>
              )}
            </div>

            {/* Primary service category */}
            {provider.services.length > 0 && (
              <p className="mt-1 text-sm text-on-surface-variant font-body">
                {provider.services[0].category.name}
              </p>
            )}

            {/* Rating row */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                <span className="text-sm font-semibold text-on-surface">
                  {rating.toFixed(1)}
                </span>
                <span className="text-sm text-on-surface-variant font-body">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <span className="text-sm text-on-surface-variant font-body">
                {provider.completedBookings} jobs done
              </span>
            </div>
          </div>

          {/* Base rate */}
          <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm text-on-surface-variant font-body">
              Base rate
            </span>
            <span className="font-headline text-xl font-bold text-primary">
              ₹{provider.baseRate}
              <span className="text-sm font-body text-on-surface-variant">/hr</span>
            </span>
          </div>

          {/* Bio */}
          {provider.bio && (
            <div>
              <h2 className="font-headline text-base font-bold text-on-surface mb-2">
                About
              </h2>
              <p className="text-sm text-on-surface-variant font-body leading-relaxed">
                {provider.bio}
              </p>
            </div>
          )}

          {/* Services offered */}
          {provider.services.length > 0 && (
            <div>
              <h2 className="font-headline text-base font-bold text-on-surface mb-3">
                Services offered
              </h2>
              <div className="flex flex-col gap-2">
                {provider.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-surface-container rounded-xl p-3 flex items-center justify-between"
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
                      <span className="shrink-0 text-sm font-semibold text-primary font-body">
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
              <h2 className="font-headline text-base font-bold text-on-surface mb-3">
                Service areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {provider.areas.map((area, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium font-body',
                      area.isPrimary
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-surface-container text-on-surface-variant'
                    )}
                  >
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{area.areaName}</span>
                    {area.isPrimary && (
                      <span className="opacity-70">(primary)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="font-headline text-base font-bold text-on-surface mb-3">
              Reviews
              {reviews.length > 0 && (
                <span className="ml-2 text-sm font-normal text-on-surface-variant font-body">
                  ({reviews.length})
                </span>
              )}
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-surface-container rounded-2xl p-6 text-center">
                <p className="text-sm text-on-surface-variant font-body">
                  No reviews yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(reviews as ReviewItem[]).map((review) => (
                  <div
                    key={review.id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4"
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
                      </div>
                      <p
                        className="shrink-0 text-sm text-[#f59e0b]"
                        aria-label={`Rating: ${review.rating} out of 5`}
                      >
                        {'★'.repeat(review.rating)}
                        <span className="text-outline-variant">
                          {'★'.repeat(5 - review.rating)}
                        </span>
                      </p>
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

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 px-4 py-4 flex items-center gap-3">
        <FavoriteButton providerId={provider.id} initialFavorited={favorited} />
        <Link
          href={`/bookings?providerId=${id}`}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2',
            'bg-brand-gradient text-on-primary font-semibold font-body',
            'px-6 py-3 text-base rounded-2xl shadow-sm',
            'hover:opacity-90 active:opacity-80 transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
          )}
        >
          Book Now
        </Link>
      </div>
    </div>
  )
}
