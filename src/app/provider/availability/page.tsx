import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AvailabilityForm from './AvailabilityForm'

async function getAvailabilityData(userId: string) {
  return prisma.providerProfile.findUnique({
    where: { userId, deletedAt: null },
    select: {
      id: true,
      isAvailable: true,
      availableFrom: true,
      availableTo: true,
    },
  })
}

function formatTimeValue(date: Date | null): string {
  if (!date) return ''
  // date is stored with 1970-01-01 epoch; extract HH:MM from UTC time
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getAvailabilityData(user.id)

  if (!profile) {
    redirect('/provider/register')
  }

  const fromValue = formatTimeValue(profile.availableFrom)
  const toValue = formatTimeValue(profile.availableTo)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/provider/dashboard" className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">Availability Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control when you appear online to customers.
        </p>

        <AvailabilityForm
          isAvailable={profile.isAvailable}
          availableFrom={fromValue}
          availableTo={toValue}
        />
      </div>
    </div>
  )
}
