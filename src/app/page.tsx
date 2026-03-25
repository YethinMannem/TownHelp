import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'
import { getMyProviderProfile } from '@/app/actions/booking'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, phone, created_at')
    .eq('id', user.id)
    .single()

  const providerProfile = await getMyProviderProfile()

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TownHelp</h1>
            <p className="text-sm text-gray-600">Hi, {displayName}</p>
          </div>
          <SignOutButton />
        </div>

        <div className="space-y-3">
          <Link
            href="/browse"
            className="block w-full p-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <p className="font-bold text-lg">Find a Service Provider</p>
            <p className="text-blue-100 text-sm mt-1">
              Browse maids, cooks, electricians, tutors and more
            </p>
          </Link>

          <Link
            href="/bookings"
            className="block w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            <p className="font-semibold text-gray-900">My Bookings</p>
            <p className="text-gray-500 text-sm mt-0.5">View and manage your bookings</p>
          </Link>

          {providerProfile ? (
            <Link
              href="/provider/dashboard"
              className="block w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Provider Dashboard</p>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {providerProfile.services?.length || 0} services listed
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/provider/register"
              className="block w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <p className="font-semibold text-gray-900">Become a Provider</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Start earning by offering your services
              </p>
            </Link>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Session 4 — The Booking Loop
        </p>
      </div>
    </div>
  )
}
