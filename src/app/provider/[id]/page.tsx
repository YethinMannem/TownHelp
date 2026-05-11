import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  MapPin,
  BadgeCheck,
  Briefcase,
  Clock,
  CalendarCheck,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
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

function formatRate(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
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
  const primaryService = provider.services[0]?.category.name ?? 'Service Provider'
  const primaryArea = provider.areas[0]?.areaName
  const activeAvailabilitySlots = availabilitySlots.filter((s) => s.isActive)
  const startingRate = provider.services.length > 0
    ? Math.min(...provider.services.map((service) => service.customRate ?? provider.baseRate))
    : provider.baseRate
  const availabilitySummary =
    activeAvailabilitySlots.length > 0
      ? `${activeAvailabilitySlots.length} day${activeAvailabilitySlots.length === 1 ? '' : 's'} a week`
      : 'Schedule unavailable'

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
        <section className="border-b border-outline-variant/20 bg-surface-container-lowest">
          <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div
                  className={cn(
                    'w-24 h-24 lg:w-28 lg:h-28 rounded-2xl flex items-center justify-center text-3xl lg:text-4xl font-extrabold font-headline select-none shadow-sm',
                    getAvatarColor(name)
                  )}
                  aria-hidden="true"
                >
                  {getInitials(name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed font-body">
                      <Sparkles className="w-3.5 h-3.5" />
                      {primaryService}
                    </span>
                    {provider.isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1 text-xs font-semibold text-on-secondary-fixed font-body">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Available
                      </span>
                    ) : (
                      <Badge variant="pending">Unavailable</Badge>
                    )}
                  </div>

                  <h1 className="font-headline text-2xl lg:text-4xl font-extrabold text-on-surface leading-tight">
                    {name}
                  </h1>
                  <p className="mt-1 text-sm lg:text-base text-on-surface-variant font-body">
                    {primaryArea ? `Serving ${primaryArea}` : 'TownHelp service provider'}
                  </p>

                  <VerificationInfo
                    isVerified={provider.isVerified}
                    isBackgroundChecked={provider.isBackgroundChecked}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-outline-variant/20 bg-surface p-2">
                <div className="px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-body">Rating</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-bold text-on-surface font-body">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {(Number(rating ?? 0)).toFixed(1)}
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-body">{reviewCount} reviews</p>
                </div>
                <div className="px-3 py-2.5 border-x border-outline-variant/15">
                  <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-body">Jobs</p>
                  <p className="mt-1 text-sm font-bold text-on-surface font-body">
                    {provider.completedBookings || 'New'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-body">
                    {provider.completedBookings > 0 ? 'completed' : 'provider'}
                  </p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-body">From</p>
                  <p className="mt-1 text-sm font-bold text-on-surface font-body">{formatRate(startingRate)}</p>
                  <p className="text-[11px] text-on-surface-variant font-body">starting rate</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <main className="space-y-5">
              <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 lg:p-5">
                <h2 className="font-headline text-base font-bold text-on-surface">About</h2>
                <p className="mt-2 text-sm text-on-surface-variant font-body leading-relaxed">
                  {provider.bio ?? `${firstName} hasn't added a bio yet. You can share job details after booking.`}
                </p>
              </section>

              {provider.services.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 lg:p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="font-headline text-base font-bold text-on-surface">Services Offered</h2>
                    <span className="text-xs text-on-surface-variant font-body">
                      {provider.services.length} service{provider.services.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="divide-y divide-outline-variant/15">
                    {provider.services.map((service) => (
                      <div
                        key={service.id}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                            <Briefcase className="w-4.5 h-4.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface font-body">
                              {service.category.name}
                            </p>
                            {service.description && (
                              <p className="text-xs text-on-surface-variant font-body mt-0.5 leading-relaxed">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 sm:text-right pl-[3.25rem] sm:pl-0">
                          <span className="text-sm font-bold text-primary font-body">
                            {formatRate(service.customRate ?? provider.baseRate)}
                          </span>
                          <span className="text-xs font-normal text-on-surface-variant font-body">
                            {rateLabel(service.rateType)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {provider.areas.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 lg:p-5">
                  <h2 className="font-headline text-base font-bold text-on-surface">Service Areas</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.areas.map((area, index) => (
                      <div
                        key={`${area.areaName}-${area.pincode ?? index}`}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold font-body border',
                          area.isPrimary
                            ? 'bg-primary-fixed text-on-primary-fixed border-primary/20'
                            : 'bg-surface text-on-surface-variant border-outline-variant/25'
                        )}
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{area.areaName}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeAvailabilitySlots.length > 0 && (
                <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 lg:p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="font-headline text-base font-bold text-on-surface">Availability</h2>
                    <span className="text-xs text-on-surface-variant font-body">{availabilitySummary}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {activeAvailabilitySlots.map((slot) => (
                      <div
                        key={slot.dayOfWeek}
                        className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 border border-outline-variant/15"
                      >
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span className="flex-1 text-sm font-semibold text-on-surface font-body">{slot.dayName}</span>
                        <span className="text-sm text-on-surface-variant font-body">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 lg:p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="font-headline text-base font-bold text-on-surface">Reviews</h2>
                  {reviews.length > 0 && (
                    <span className="text-xs text-on-surface-variant font-body">{reviews.length} total</span>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="rounded-xl bg-surface p-4 border border-outline-variant/15">
                    <p className="text-sm font-semibold text-on-surface font-body">New on TownHelp</p>
                    <p className="text-xs text-on-surface-variant font-body mt-1 leading-relaxed">
                      {firstName} recently joined TownHelp and hasn&apos;t received reviews yet.
                      TownHelp verifies eligible providers before they accept bookings.
                    </p>
                    {provider.isVerified && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold font-body mt-3">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        ID verified by TownHelp
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(reviews as ReviewItem[]).map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl bg-surface p-4 border border-outline-variant/15"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
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
                            <span className="inline-flex items-center gap-1 text-[10px] text-primary/80 font-body font-medium mt-1">
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
                          <p className="mt-3 text-sm text-on-surface-variant font-body leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>

            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-3">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant font-body">Booking Summary</p>
                  <p className="mt-2 font-headline text-lg font-bold text-on-surface">{primaryService}</p>
                  <div className="mt-4 space-y-3 text-sm font-body">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <IndianRupee className="w-4 h-4 text-primary shrink-0" />
                      <span>Starts at <strong className="text-on-surface">{formatRate(startingRate)}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>{availabilitySummary}</span>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Chat unlocks after booking</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Sticky bottom actions — above BottomNav on mobile, at bottom on desktop */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-60 right-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 shadow-[0_-12px_30px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 lg:px-8 py-3 max-w-6xl mx-auto">
          <FavoriteButton providerId={provider.id} initialFavorited={favorited} />
          <div className="hidden sm:block min-w-0 flex-1">
            <p className="text-sm font-semibold text-on-surface font-body truncate">{name}</p>
            <p className="text-xs text-on-surface-variant font-body truncate">
              {primaryService} {primaryArea ? `in ${primaryArea}` : ''}
            </p>
          </div>
          <div className="flex-1 sm:flex-none sm:w-[min(26rem,45vw)] flex flex-col gap-1.5">
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
