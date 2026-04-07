import { requireAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import { getWeeklyAvailability } from '@/app/actions/provider'
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
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export default async function AvailabilityPage() {
  const authUser = await requireAuthUser()

  const profile = await getAvailabilityData(authUser.id)

  if (!profile) {
    redirect('/provider/register')
  }

  const fromValue = formatTimeValue(profile.availableFrom)
  const toValue = formatTimeValue(profile.availableTo)

  const { slots } = await getWeeklyAvailability()
  const weeklySlots = slots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    isActive: s.isActive,
  }))

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0 lg:pl-60">
      <div className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/provider/dashboard"
          className="text-sm font-body text-primary hover:underline"
        >
          &larr; Dashboard
        </Link>
      </div>

      <div className="pt-14">
        <div className="bg-surface-container-low border-b border-outline-variant px-4 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-on-surface">
                Availability Settings
              </h1>
              <p className="font-body text-sm text-on-surface-variant">
                Control when you appear online and when customers can book you.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 mt-5">
          <AvailabilityForm
            isAvailable={profile.isAvailable}
            availableFrom={fromValue}
            availableTo={toValue}
            weeklySlots={weeklySlots}
          />
        </div>
      </div>
    </div>
  )
}
