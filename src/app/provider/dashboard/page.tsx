import { getMyProviderProfile, getProviderDashboard } from '@/app/actions/booking'
import { requireAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, MapPin, Plus, Clock, CheckCircle, AlertCircle, IndianRupee, CalendarDays, TrendingUp, ArrowLeft, ChevronRight, Edit3 } from 'lucide-react'
import type { ProviderServiceItem, ServiceAreaItem } from '@/types'
import WhatsAppSettings from './_components/WhatsAppSettings'

export default async function ProviderDashboard() {
  await requireAuthUser()

  const profile = await getMyProviderProfile()

  if (!profile) {
    redirect('/provider/register')
  }

  // Fetch dashboard stats
  let stats = null
  try {
    stats = await getProviderDashboard()
  } catch {
    // Stats are optional, dashboard still renders
  }

  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline text-base font-bold text-on-surface">
          Dashboard
        </h1>
        <div className="w-9" />
      </header>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 pt-14 mt-4 space-y-5">
        {/* Profile Card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4">
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
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-body">
            <span className="flex items-center gap-1 text-on-surface min-w-0">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="font-semibold">{profile.ratingAvg.toFixed(1)}</span>
              <span className="text-on-surface-variant">({profile.ratingCount})</span>
            </span>
            <span className="flex items-center gap-1 text-on-surface min-w-0">
              <IndianRupee className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="font-semibold">{profile.baseRate}</span>
              <span className="text-on-surface-variant">/hr</span>
            </span>
          </div>

          {profile.areas && profile.areas.length > 0 && (
            <div className="mt-2.5 flex items-start gap-1.5 text-sm font-body text-on-surface-variant">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{profile.areas.map((a: ServiceAreaItem) => a.areaName).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        {stats && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
            <div className="bg-primary-fixed/40 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-xs text-on-surface-variant font-body">This Month</span>
              </div>
              <p className="font-headline text-xl font-bold text-on-surface">
                {stats.bookingsThisMonth}
              </p>
              <p className="text-xs text-on-surface-variant font-body">bookings</p>
            </div>
            <div className="bg-secondary-fixed/40 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <IndianRupee className="w-4 h-4 text-secondary" />
                <span className="text-xs text-on-surface-variant font-body">Earnings</span>
              </div>
              <p className="font-headline text-lg sm:text-xl font-bold text-on-surface break-words">
                ₹{stats.earningsThisMonth}
              </p>
              <p className="text-xs text-on-surface-variant font-body">this month</p>
            </div>
            <div className="bg-tertiary-fixed/40 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-tertiary" />
                <span className="text-xs text-on-surface-variant font-body">Completion</span>
              </div>
              <p className="font-headline text-lg sm:text-xl font-bold text-on-surface">
                {stats.completionRate}%
              </p>
              <p className="text-xs text-on-surface-variant font-body">rate</p>
            </div>
            <div className="bg-error-container/30 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-error" />
                <span className="text-xs text-on-surface-variant font-body">Pending</span>
              </div>
              <p className="font-headline text-xl font-bold text-on-surface">
                {stats.pendingRequests}
              </p>
              <p className="text-xs text-on-surface-variant font-body">requests</p>
            </div>
          </div>
        )}

        {/* Services Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-headline text-sm font-bold text-on-surface">
              Your Services
            </h2>
            <Link
              href="/provider/add-service"
              className="flex items-center gap-1 text-sm font-body font-medium text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              Add
            </Link>
          </div>

          {(!profile.services || profile.services.length === 0) ? (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 text-center">
              <p className="font-body text-sm text-on-surface-variant mb-4">
                No services listed yet. Add your first service to start receiving bookings.
              </p>
              <Link
                href="/provider/add-service"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-body font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {profile.services.map((service: ProviderServiceItem) => (
                <div
                  key={service.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-4 py-3 flex items-center justify-between gap-3"
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
                    <p className="font-body font-bold text-primary text-sm">
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
          <h2 className="font-headline text-sm font-bold text-on-surface mb-2.5">
            Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <WhatsAppSettings
              whatsappOptIn={profile.whatsappOptIn}
              whatsappNumber={profile.whatsappNumber}
            />
            <Link
              href="/provider/availability"
              className="flex items-center gap-3 w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-4 py-3.5 hover:bg-surface-container/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-on-surface text-sm">Availability</p>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  Working hours and online status
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
            </Link>
            <Link
              href="/bookings"
              className="flex items-center gap-3 w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-4 py-3.5 hover:bg-surface-container/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-on-surface text-sm">My Bookings</p>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  View and manage all bookings
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
            </Link>
            <Link
              href="/provider/edit"
              className="flex items-center gap-3 w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-4 py-3.5 hover:bg-surface-container/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4 text-tertiary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-on-surface text-sm">Edit Profile</p>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  Update name, rate and bio
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
