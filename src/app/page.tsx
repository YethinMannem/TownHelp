import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServiceCategories, getProviders } from '@/app/actions/booking'
import { PageHeader } from '@/components/ui/PageHeader'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { ProviderCard } from '@/components/ui/ProviderCard'
import { CATEGORY_LUCIDE_ICONS, CATEGORY_COLOR_CLASSES } from '@/lib/constants'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/welcome')

  // Fetch data in parallel
  const [categories, providers] = await Promise.all([
    getServiceCategories(),
    getProviders({ limit: 10 }),
  ])

  const displayName = user.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-surface pb-28">
      <PageHeader showLocation showNotifications />

      {/* Scrollable content — top padding clears the fixed header */}
      <div className="pt-16 px-4 space-y-8">

        {/* Greeting */}
        <section className="pt-4">
          <h1 className="font-headline text-2xl font-extrabold text-on-surface">
            Hi {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant font-body">
            What do you need help with today?
          </p>
        </section>

        {/* Category grid */}
        <section>
          <h2 className="font-headline text-base font-bold text-on-surface mb-3">
            Browse by category
          </h2>
          <div className="grid grid-cols-3 gap-3">
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
        {providers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline text-base font-bold text-on-surface">
                Popular near you
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {providers.map((provider) => (
                <div key={provider.id} className="flex-shrink-0">
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
          </section>
        )}

      </div>
    </div>
  )
}
