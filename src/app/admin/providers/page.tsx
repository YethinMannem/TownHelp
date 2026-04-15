import { getAdminProviders } from '@/app/actions/admin'
import type { AdminProviderItem } from '@/app/actions/admin'
import VerifyButton from './_components/VerifyButton'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function ProviderCard({ provider }: { provider: AdminProviderItem }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-on-surface font-body truncate">
            {provider.displayName}
          </h3>
          {provider.bio && (
            <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">
              {provider.bio}
            </p>
          )}
        </div>
        <VerifyButton
          providerId={provider.id}
          isVerified={provider.isVerified}
        />
      </div>

      {/* Contact */}
      <div className="space-y-0.5 text-sm text-on-surface-variant">
        {provider.user.email && (
          <p>
            <span className="font-medium text-on-surface">Email:</span>{' '}
            {provider.user.email}
          </p>
        )}
        {provider.user.phone && (
          <p>
            <span className="font-medium text-on-surface">Phone:</span>{' '}
            {provider.user.phone}
          </p>
        )}
      </div>

      {/* Services */}
      {provider.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {provider.services.map((s) => (
            <span
              key={s.categoryName}
              className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-body font-medium"
            >
              {s.categoryName}
            </span>
          ))}
        </div>
      )}

      {/* Areas */}
      {provider.areas.length > 0 && (
        <p className="text-xs text-on-surface-variant">
          <span className="font-medium text-on-surface">Areas: </span>
          {provider.areas.map((a) => a.areaName).join(', ')}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/20">
        <span>Joined {formatDate(provider.createdAt)}</span>
        {provider.verifiedAt && (
          <span>Verified {formatDate(provider.verifiedAt)}</span>
        )}
      </div>
    </div>
  )
}

export default async function AdminProvidersPage() {
  const providers = await getAdminProviders()

  const pending = providers.filter((p) => !p.isVerified)
  const verified = providers.filter((p) => p.isVerified)

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface font-body">
            Admin — Provider Verification
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {pending.length} pending &middot; {verified.length} verified
          </p>
        </div>

        {/* Pending section */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-on-surface font-body mb-4">
            Pending Verification
            <span className="ml-2 text-sm font-normal text-on-surface-variant">
              ({pending.length})
            </span>
          </h2>
          {pending.length === 0 ? (
            <div className="bg-surface-container rounded-2xl px-5 py-8 text-center text-sm text-on-surface-variant">
              No providers awaiting verification.
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </section>

        {/* Verified section */}
        <section>
          <h2 className="text-base font-semibold text-on-surface font-body mb-4">
            Verified Providers
            <span className="ml-2 text-sm font-normal text-on-surface-variant">
              ({verified.length})
            </span>
          </h2>
          {verified.length === 0 ? (
            <div className="bg-surface-container rounded-2xl px-5 py-8 text-center text-sm text-on-surface-variant">
              No verified providers yet.
            </div>
          ) : (
            <div className="space-y-4">
              {verified.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
