import Link from 'next/link'
import { requireAuthUser, getViewerContext } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServiceCategories, getProviders, getServiceAreas } from '@/app/actions/booking'
import { getUnreadNotificationCount } from '@/services/notification.service'
import { PageHeader } from '@/components/ui/PageHeader'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { ProviderCard } from '@/components/ui/ProviderCard'
import OnboardingBanner from '@/components/OnboardingBanner'
import { CATEGORY_LUCIDE_ICONS, CATEGORY_COLOR_CLASSES } from '@/lib/constants'
import { Search, ArrowRight, Briefcase } from 'lucide-react'

export default async function HomePage() {
  const authUser = await requireAuthUser('/welcome')

  const [viewer, categories, { providers }, areas] = await Promise.all([
    getViewerContext(),
    getServiceCategories(),
    getProviders({ limit: 10 }),
    getServiceAreas(),
  ])
  const [unreadNotificationsCount, dbUser] = await Promise.all([
    getUnreadNotificationCount(authUser.id),
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: { fullName: true },
    }),
  ])

  const displayName = dbUser?.fullName?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      <PageHeader
        showLocation
        locationLabel={viewer.locationLabel ?? 'Set your location'}
        showNotifications
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="pt-14 px-4 lg:px-8 space-y-6 max-w-4xl mx-auto">

        {/* Onboarding banner — only shown when no location set */}
        {viewer.locationLabel === null && (
          <OnboardingBanner areas={areas} fullName={dbUser?.fullName ?? displayName} />
        )}

        {/* Greeting */}
        <section className="pt-4">
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface">
            Hi {displayName} 👋
          </h1>
          <p className="mt-1 text-sm md:text-base text-on-surface-variant font-body">
            What do you need help with today?
          </p>
        </section>

        {/* Search bar */}
        <Link
          href="/browse"
          className="flex items-center gap-3 w-full max-w-xl px-4 py-3 bg-surface-container rounded-2xl text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <Search className="w-5 h-5 text-outline shrink-0" />
          <span className="text-sm font-body">Search for services or providers...</span>
        </Link>

        {/* Category grid */}
        <section>
          <h2 className="font-headline text-base font-bold text-on-surface mb-3">
            Browse by category
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-2.5 sm:gap-3">
            {categories.map((cat) => {
              const Icon = CATEGORY_LUCIDE_ICONS[cat.slug]
              const colorClasses = CATEGORY_COLOR_CLASSES[cat.slug] ?? 'bg-surface-container text-on-surface'
              if (!Icon) return null
              return (
                <CategoryCard
                  key={cat.id}
                  slug={cat.slug}
                  label={cat.name}
                  Icon={Icon}
                  colorClasses={colorClasses}
                />
              )
            })}
          </div>
        </section>

        {/* Popular providers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-base font-bold text-on-surface">
              Popular near you
            </h2>
            {providers.length > 0 && (
              <Link
                href="/browse"
                className="flex items-center gap-1 text-sm font-medium text-primary font-body hover:underline"
              >
                See all
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {providers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest p-6 text-center">
              <p className="font-semibold text-on-surface font-body text-sm">No providers yet in your area</p>
              <p className="text-xs text-on-surface-variant font-body mt-1 mb-4">
                Be the first — sign up as a provider and start earning.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary font-body hover:underline"
              >
                Browse all providers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* Horizontal scroll on mobile */}
              <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {providers.map((provider) => (
                  <div key={provider.id} className="w-[min(75vw,18rem)] shrink-0">
                    <ProviderCard
                      providerId={provider.id}
                      name={provider.user.fullName}
                      role={provider.services[0]?.category.name ?? 'Service Provider'}
                      rating={provider.ratingAvg}
                      reviewCount={provider.ratingCount}
                      pricePerHour={provider.services[0]?.customRate ?? provider.baseRate}
                      isVerified={provider.isVerified}
                    />
                  </div>
                ))}
              </div>
              {/* Grid on desktop */}
              <div className="hidden md:grid md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    providerId={provider.id}
                    name={provider.user.fullName}
                    role={provider.services[0]?.category.name ?? 'Service Provider'}
                    rating={provider.ratingAvg}
                    reviewCount={provider.ratingCount}
                    pricePerHour={provider.services[0]?.customRate ?? provider.baseRate}
                    isVerified={provider.isVerified}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Become a provider CTA — shown only if user is not already a provider */}
        {!viewer.providerProfileId && (
          <section className="pb-2">
            <div className="flex items-center gap-4 bg-surface-container rounded-2xl px-4 py-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-fixed flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface font-body text-sm">Offer your services</p>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  Earn money helping your neighbors.
                </p>
              </div>
              <Link
                href="/provider/register"
                className="shrink-0 text-sm font-semibold text-primary font-body hover:underline"
              >
                Get started
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
