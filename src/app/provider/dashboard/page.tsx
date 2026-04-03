import { getMyProviderProfile } from '@/app/actions/booking'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, MapPin, Plus, Clock, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react'
import type { ProviderServiceItem, ServiceAreaItem } from '@/types'

export default async function ProviderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getMyProviderProfile()

  if (!profile) {
    redirect('/provider/register')
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Frosted-glass fixed header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-body text-primary hover:underline"
        >
          ← Home
        </Link>
        <h1 className="font-headline text-base font-semibold text-on-surface">
          Provider Dashboard
        </h1>
        <div className="w-12" /> {/* spacer to centre the title */}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-14 mt-5 space-y-5">
        {/* Profile Card */}
        <div className="bg-surface-container rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-headline text-lg font-bold text-on-surface truncate">
                {profile.displayName}
              </h2>
              {profile.bio && (
                <p className="font-body text-sm text-on-surface-variant mt-1 line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-body font-medium ${
                profile.isVerified
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'bg-secondary-fixed text-on-secondary-fixed'
              }`}
            >
              {profile.isVerified
                ? <><CheckCircle className="w-3 h-3" /> Verified</>
                : <><AlertCircle className="w-3 h-3" /> Pending</>
              }
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-5 text-sm font-body">
            <span className="flex items-center gap-1 text-on-surface">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="font-semibold">{profile.ratingAvg.toFixed(1)}</span>
              <span className="text-on-surface-variant">({profile.ratingCount})</span>
            </span>
            <span className="flex items-center gap-1 text-on-surface">
              <IndianRupee className="w-4 h-4 text-on-surface-variant" />
              <span className="font-semibold">{profile.baseRate}</span>
              <span className="text-on-surface-variant">/hr base</span>
            </span>
          </div>

          {profile.areas && profile.areas.length > 0 && (
            <div className="mt-3 flex items-start gap-1.5 text-sm font-body text-on-surface-variant">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              <span>{profile.areas.map((a: ServiceAreaItem) => a.areaName).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Services Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-base font-semibold text-on-surface">
              Your Services
            </h2>
            <Link
              href="/provider/add-service"
              className="flex items-center gap-1 text-sm font-body font-medium text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </Link>
          </div>

          {(!profile.services || profile.services.length === 0) ? (
            <div className="bg-surface-container rounded-2xl p-6 text-center">
              <p className="font-body text-sm text-on-surface-variant mb-4">
                No services listed yet. Add your first service to start receiving bookings.
              </p>
              <Link
                href="/provider/add-service"
                className="inline-flex items-center gap-2 px-5 py-3 bg-brand-gradient text-on-primary font-body font-semibold text-sm rounded-2xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Your First Service
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.services.map((service: ProviderServiceItem) => (
                <div
                  key={service.id}
                  className="bg-surface-container rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-on-surface text-sm">
                      {service.category?.name}
                    </p>
                    {service.description && (
                      <p className="font-body text-xs text-on-surface-variant mt-0.5 truncate">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-body font-bold text-on-surface text-sm">
                      ₹{service.customRate || profile.baseRate}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      /{service.rateType?.toLowerCase() || 'hr'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-headline text-base font-semibold text-on-surface mb-3">
            Quick Actions
          </h2>
          <Link
            href="/provider/availability"
            className="flex items-center gap-3 w-full bg-surface-container rounded-2xl px-4 py-4 hover:bg-surface-container-high transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-medium text-on-surface text-sm">Availability Settings</p>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">
                Set your working hours and online status
              </p>
            </div>
            <span className="font-body text-on-surface-variant text-lg leading-none">›</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
