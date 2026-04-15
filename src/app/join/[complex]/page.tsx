import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Search, CalendarCheck, Star, Users } from 'lucide-react'
import { getProviders, getServiceCategories } from '@/app/actions/booking'
import { ProviderCard } from '@/components/ui/ProviderCard'
import { CATEGORY_LUCIDE_ICONS, CATEGORY_COLOR_CLASSES } from '@/lib/constants'
import type { ServiceCategoryItem, ProviderListItem } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface JoinPageProps {
  params: Promise<{ complex: string }>
}

export async function generateMetadata({ params }: JoinPageProps): Promise<Metadata> {
  const { complex } = await params
  const name = toTitleCase(complex)
  const title = `TownHelp — Trusted services for ${name} residents`
  const description =
    'Find verified maids, cooks, electricians and more in your area. Join your neighbors on TownHelp.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function JoinPage({ params }: JoinPageProps) {
  const { complex } = await params
  const complexName = toTitleCase(complex)

  // Both actions are already public — no auth required.
  // Wrap in try/catch so a DB outage degrades gracefully.
  let categories: ServiceCategoryItem[] = []
  let providers: ProviderListItem[] = []

  try {
    categories = await getServiceCategories()
  } catch {
    // Show empty state — non-fatal
  }

  try {
    const result = await getProviders({ limit: 6, sort: 'rating' })
    providers = result.providers
  } catch {
    // Show empty state — non-fatal
  }

  return (
    <div className="relative min-h-screen bg-surface overflow-x-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Blob background — reused from /welcome                             */}
      {/* ------------------------------------------------------------------ */}
      <div aria-hidden="true" className="pointer-events-none">
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-primary-fixed opacity-60 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-secondary-fixed opacity-40 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-tertiary-fixed opacity-30 blur-2xl" />
      </div>

      <div className="relative z-10">
        {/* ---------------------------------------------------------------- */}
        {/* 1. Hero                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="max-w-2xl mx-auto px-6 pt-16 pb-12 flex flex-col items-center text-center gap-6">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg">
            <MapPin className="w-8 h-8 text-on-primary" strokeWidth={2.5} />
          </div>

          {/* Wordmark */}
          <p className="text-sm font-semibold tracking-widest text-primary uppercase font-body">
            TownHelp
          </p>

          {/* Headline */}
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface leading-tight">
            Trusted services for{' '}
            <span className="text-primary">{complexName}</span> residents
          </h1>

          {/* Subheading */}
          <p className="text-base text-on-surface-variant font-body leading-relaxed max-w-sm">
            Verified maids, cooks, electricians and more — right in your
            neighborhood.
          </p>

          {/* CTAs */}
          <div className="w-full max-w-sm flex flex-col gap-3 mt-2">
            <Link
              href="/login?redirect=/browse"
              className="w-full flex items-center justify-center gap-2 bg-brand-gradient text-on-primary font-semibold text-base rounded-2xl px-6 py-4 shadow-md hover:opacity-90 active:opacity-80 transition-opacity font-body"
            >
              <Search className="w-5 h-5" />
              Find a service
            </Link>

            <Link
              href="/login?role=provider"
              className="w-full flex items-center justify-center gap-2 bg-surface-container border border-outline-variant/40 text-on-surface font-semibold text-base rounded-2xl px-6 py-4 hover:bg-surface-container-high active:bg-surface-container-high transition-colors font-body"
            >
              Offer your services
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 2. Service categories grid                                       */}
        {/* ---------------------------------------------------------------- */}
        {categories.length > 0 && (
          <section className="max-w-2xl mx-auto px-6 py-10">
            <h2 className="font-headline text-xl font-bold text-on-surface mb-6 text-center">
              What we offer
            </h2>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {categories.map((cat) => {
                const Icon = CATEGORY_LUCIDE_ICONS[cat.slug] ?? MapPin
                const colorClass =
                  CATEGORY_COLOR_CLASSES[cat.slug] ?? 'bg-surface-container text-on-surface'

                return (
                  <Link
                    key={cat.id}
                    href={`/login?redirect=/browse?category=${cat.slug}`}
                    className="flex flex-col items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} group-hover:scale-105 group-active:scale-95 transition-transform`}
                    >
                      <Icon className="w-7 h-7" strokeWidth={1.8} />
                    </div>
                    <span className="text-xs text-center text-on-surface-variant font-body leading-tight">
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* 3. Providers section                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="max-w-2xl mx-auto px-6 py-10">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2 text-center">
            Available near you
          </h2>
          <p className="text-sm text-on-surface-variant font-body text-center mb-6">
            Rated and reviewed by your neighbors
          </p>

          {providers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {providers.map((provider) => {
                const primaryService = provider.services[0]
                const role = primaryService?.category.name ?? 'Service Provider'
                return (
                  <ProviderCard
                    key={provider.id}
                    providerId={provider.id}
                    name={provider.displayName}
                    role={role}
                    rating={provider.ratingAvg}
                    reviewCount={provider.ratingCount}
                    pricePerHour={provider.baseRate}
                    isVerified={provider.isVerified}
                  />
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-8 text-center">
              <Users className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
              <p className="font-semibold text-on-surface font-body">
                Be the first provider in your area
              </p>
              <p className="text-sm text-on-surface-variant font-body mt-1">
                Sign up and start earning from your neighbors.
              </p>
              <Link
                href="/login?role=provider"
                className="inline-block mt-4 text-sm font-semibold text-primary hover:underline font-body"
              >
                Get started
              </Link>
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 4. How it works                                                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="max-w-2xl mx-auto px-6 py-10">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-8 text-center">
            How it works
          </h2>

          <ol className="flex flex-col gap-6">
            <HowItWorksStep
              number={1}
              icon={<Search className="w-5 h-5" />}
              title="Browse verified providers"
              description="See ratings, reviews, and prices from providers in your area."
            />
            <HowItWorksStep
              number={2}
              icon={<CalendarCheck className="w-5 h-5" />}
              title="Book at a time that works"
              description="Pick a slot that fits your schedule. No calls needed."
            />
            <HowItWorksStep
              number={3}
              icon={<Star className="w-5 h-5" />}
              title="Pay and review after the job"
              description="Pay directly to the provider. Leave a review to help your neighbors."
            />
          </ol>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 5. Footer CTA                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section className="max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="bg-surface-container rounded-3xl p-8 flex flex-col items-center gap-4">
            <h2 className="font-headline text-2xl font-extrabold text-on-surface leading-tight">
              Join {complexName} on TownHelp
            </h2>
            <p className="text-sm text-on-surface-variant font-body max-w-xs">
              Your neighbors are already using TownHelp. Sign up in under a minute.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-brand-gradient text-on-primary font-semibold text-base rounded-2xl px-8 py-4 shadow-md hover:opacity-90 active:opacity-80 transition-opacity font-body"
            >
              Create free account
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 6. Simple footer                                                 */}
        {/* ---------------------------------------------------------------- */}
        <footer className="max-w-2xl mx-auto px-6 py-8 flex flex-col items-center gap-2 text-xs text-on-surface-variant font-body border-t border-outline-variant/20">
          <p>2026 TownHelp · Hyderabad</p>
          <Link
            href="/login?role=provider"
            className="text-primary hover:underline"
          >
            I&apos;m a provider
          </Link>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: How it works step
// ---------------------------------------------------------------------------

interface HowItWorksStepProps {
  number: number
  icon: React.ReactNode
  title: string
  description: string
}

function HowItWorksStep({ number, icon, title, description }: HowItWorksStepProps) {
  return (
    <li className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold font-headline text-sm">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-primary">{icon}</span>
          <p className="font-semibold text-on-surface font-body">{title}</p>
        </div>
        <p className="text-sm text-on-surface-variant font-body leading-relaxed">
          {description}
        </p>
      </div>
    </li>
  )
}
