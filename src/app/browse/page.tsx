import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProviders } from '@/app/actions/booking'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProviderCard } from '@/components/ui/ProviderCard'

interface BrowsePageProps {
  searchParams: Promise<{ category?: string; search?: string; area?: string }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.error('[BrowsePage] Auth error:', error)
    redirect('/welcome')
  }
  if (!user) redirect('/welcome')

  const { category, search, area } = await searchParams

  const providers = await getProviders({
    categorySlug: category,
    search: search?.trim(),
    area: area?.trim(),
    limit: 20,
  })

  const categoryLabel = category
    ? category
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'All Services'

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Sticky page header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline font-bold text-base text-on-surface">
          {categoryLabel}
        </h1>
      </header>

      <div className="pt-16 px-4 py-6">
        {/* Active filter summary */}
        {(search || area) && (
          <p className="text-sm text-on-surface-variant font-body mb-4">
            Showing results
            {search && (
              <>
                {' '}for &ldquo;<span className="font-medium text-on-surface">{search}</span>&rdquo;
              </>
            )}
            {area && (
              <>
                {' '}in <span className="font-medium text-on-surface">{area}</span>
              </>
            )}
          </p>
        )}

        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
              <ArrowLeft className="w-8 h-8 text-outline" />
            </div>
            <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
              No providers yet
            </h2>
            <p className="text-sm text-on-surface-variant font-body max-w-xs">
              Be the first to offer {categoryLabel.toLowerCase()} services in your area.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
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
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
