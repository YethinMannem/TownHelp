import { requireAuthUser } from '@/lib/auth'
import { getProviders, getServiceCategories } from '@/app/actions/booking'
import { ArrowLeft, SearchX } from 'lucide-react'
import Link from 'next/link'
import { ProviderCard } from '@/components/ui/ProviderCard'
import SearchFilters from './SearchFilters'
import SortSelect from './SortSelect'
import Pagination from './Pagination'
import type { ProviderSortOption } from '@/types'

const VALID_SORTS = new Set<string>(['rating', 'price_low', 'price_high', 'experience'])
const PAGE_SIZE = 20

interface BrowsePageProps {
  searchParams: Promise<{ category?: string; search?: string; area?: string; sort?: string; page?: string; availableToday?: string; lat?: string; lng?: string; nearMe?: string }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  await requireAuthUser('/welcome')

  const { category, search, area, sort: rawSort, page: rawPage, availableToday: rawAvailableToday, lat: rawLat, lng: rawLng, nearMe: rawNearMe } = await searchParams

  const sort = (VALID_SORTS.has(rawSort ?? '') ? rawSort : 'rating') as ProviderSortOption
  const page = Math.max(parseInt(rawPage ?? '1', 10) || 1, 1)
  const availableToday = rawAvailableToday === '1'
  const nearMe = rawNearMe === '1'
  const lat = rawLat ? parseFloat(rawLat) : undefined
  const lng = rawLng ? parseFloat(rawLng) : undefined

  const [{ providers, totalCount }, categories] = await Promise.all([
    getProviders({
      categorySlug: category,
      search: search?.trim(),
      area: nearMe ? undefined : area?.trim(),
      lat: nearMe ? lat : undefined,
      lng: nearMe ? lng : undefined,
      sort,
      page,
      limit: PAGE_SIZE,
      availableToday,
    }),
    getServiceCategories(),
  ])

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)
  const filterParams = {
    category,
    search,
    area: nearMe ? undefined : area,
    sort: sort !== 'rating' ? sort : undefined,
    availableToday: availableToday ? '1' : undefined,
    lat: nearMe ? rawLat : undefined,
    lng: nearMe ? rawLng : undefined,
    nearMe: nearMe ? '1' : undefined,
  }

  const categoryLabel = category
    ? categories.find((c) => c.slug === category)?.name ??
      category
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'All Services'

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline font-bold text-base text-on-surface truncate">
          {categoryLabel}
        </h1>
      </header>

      <div className="pt-14 px-4 lg:px-8 max-w-5xl mx-auto">
        {/* Search & Filters */}
        <div className="py-4 max-w-2xl">
          <SearchFilters
            categorySlug={category}
            currentSearch={search}
            currentAvailableToday={availableToday}
            currentNearMe={nearMe}
          />

          {/* Sort */}
          <div className="mt-3 max-w-[200px]">
            <SortSelect currentSort={sort} searchParams={filterParams} />
          </div>

          {/* Category chips when viewing all */}
          {!category && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide mt-3 lg:flex-wrap lg:overflow-x-visible">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/browse?category=${cat.slug}`}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-body bg-surface-container text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Results summary */}
        {(search || area || availableToday || nearMe || totalCount > 0) && (
          <p className="text-sm text-on-surface-variant font-body mb-4">
            {totalCount} result{totalCount !== 1 ? 's' : ''}
            {search && (
              <> for &ldquo;<span className="font-medium text-on-surface">{search}</span>&rdquo;</>
            )}
            {nearMe ? (
              <> <span className="font-medium text-on-surface">near you</span></>
            ) : area ? (
              <> in <span className="font-medium text-on-surface">{area}</span></>
            ) : null}
            {availableToday && (
              <> &middot; available today</>
            )}
          </p>
        )}

        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
              <SearchX className="w-8 h-8 text-outline" />
            </div>
            <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
              No providers found
            </h2>
            <p className="text-sm text-on-surface-variant font-body max-w-xs">
              {availableToday
                ? 'No providers available today in this area. Try removing the "Available Today" filter.'
                : search || area
                  ? 'Try adjusting your filters or searching in a nearby area.'
                  : 'Be the first to offer services in this area.'}
            </p>
            {!search && !area && !category && (
              <a
                href="mailto:help@townhelp.in?subject=Notify me when providers are available"
                className="mt-2 text-sm font-medium text-primary font-body hover:underline"
              >
                Notify me when available &rarr;
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  providerId={provider.id}
                  name={provider.displayName}
                  role={provider.services[0]?.category?.name ?? 'Service Provider'}
                  rating={Number(provider.ratingAvg ?? 0)}
                  reviewCount={provider.ratingCount ?? 0}
                  pricePerHour={Number(provider.services[0]?.customRate ?? provider.baseRate ?? 0)}
                  isVerified={provider.isVerified}
                  completedBookings={provider.completedBookings}
                  rateType={provider.services[0]?.rateType ?? null}
                  distanceKm={provider.distanceKm}
                  className="w-full"
                />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              searchParams={filterParams}
            />
          </>
        )}
      </div>
    </div>
  )
}
