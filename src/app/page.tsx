import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, auth_provider, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TownHelp</h1>
          <SignOutButton />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Welcome, {profile?.full_name || 'User'}!
          </h2>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">Email:</span> {profile?.email || user.email}</p>
            <p><span className="font-medium text-gray-700">Auth Provider:</span> {profile?.auth_provider}</p>
            <p><span className="font-medium text-gray-700">Member since:</span> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm font-medium">
            Auth is working! Your account is synced and secured.
          </p>
        </div>
      </div>
    </div>
  )
}
