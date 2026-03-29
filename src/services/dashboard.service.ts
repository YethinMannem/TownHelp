import { prisma } from '@/lib/prisma'
import { BookingStatus, PaymentStatus } from '@/generated/prisma'

export interface TodayBooking {
  id: string
  bookingNumber: string
  status: string
  scheduledStart: Date | null
  serviceAddress: string | null
  requesterNotes: string | null
  requesterName: string
  categoryName: string
  categoryIcon: string | null
}

export interface ProviderDashboardStats {
  bookingsThisMonth: number
  bookingsTotal: number
  earningsThisMonth: number
  earningsTotal: number
  averageRating: number
  totalReviews: number
  completionRate: number // percentage, 0-100
  pendingRequests: number // bookings with status PENDING
  todaySchedule: TodayBooking[]
}

// IST is UTC+5:30. Returns the start of the current month in IST, as a UTC Date.
function getStartOfMonthIST(): Date {
  const nowUtc = new Date()
  // Shift to IST
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const nowIst = new Date(nowUtc.getTime() + istOffsetMs)
  // 1st of month, midnight IST
  const startIst = new Date(
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), 1, 0, 0, 0, 0)
  )
  // Convert back to UTC by subtracting IST offset
  return new Date(startIst.getTime() - istOffsetMs)
}

// Returns [startOfToday, endOfToday] in UTC, bounded by IST day boundaries.
function getTodayRangeIST(): [Date, Date] {
  const nowUtc = new Date()
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const nowIst = new Date(nowUtc.getTime() + istOffsetMs)
  // Midnight IST today
  const startIst = new Date(
    Date.UTC(
      nowIst.getUTCFullYear(),
      nowIst.getUTCMonth(),
      nowIst.getUTCDate(),
      0,
      0,
      0,
      0
    )
  )
  // Midnight IST tomorrow (exclusive end)
  const endIst = new Date(startIst.getTime() + 24 * 60 * 60 * 1000)
  return [
    new Date(startIst.getTime() - istOffsetMs),
    new Date(endIst.getTime() - istOffsetMs),
  ]
}

export async function getProviderDashboardStats(
  providerProfileId: string
): Promise<ProviderDashboardStats> {
  const startOfMonth = getStartOfMonthIST()
  const [startOfToday, endOfToday] = getTodayRangeIST()

  const [
    bookingsThisMonth,
    bookingsTotal,
    earningsThisMonthResult,
    earningsTotalResult,
    providerProfile,
    cancelledBookings,
    completedBookings,
    pendingRequests,
    todayBookings,
  ] = await Promise.all([
    // 1. Bookings this month
    prisma.booking.count({
      where: {
        providerId: providerProfileId,
        createdAt: { gte: startOfMonth },
      },
    }),

    // 2. All bookings total
    prisma.booking.count({
      where: { providerId: providerProfileId },
    }),

    // 3. Earnings this month (completed payments)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        booking: { providerId: providerProfileId },
        status: PaymentStatus.COMPLETED,
        paidAt: { gte: startOfMonth },
      },
    }),

    // 4. Earnings total (completed payments)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        booking: { providerId: providerProfileId },
        status: PaymentStatus.COMPLETED,
      },
    }),

    // 5. Provider profile for rating data
    prisma.providerProfile.findUnique({
      where: { id: providerProfileId },
      select: { ratingAvg: true, ratingCount: true },
    }),

    // 6. Cancelled bookings (for completion rate denominator)
    prisma.booking.count({
      where: {
        providerId: providerProfileId,
        status: BookingStatus.CANCELLED,
      },
    }),

    // 7. Completed bookings (for completion rate numerator)
    prisma.booking.count({
      where: {
        providerId: providerProfileId,
        status: BookingStatus.COMPLETED,
      },
    }),

    // 8. Pending booking requests
    prisma.booking.count({
      where: {
        providerId: providerProfileId,
        status: BookingStatus.PENDING,
      },
    }),

    // 9. Today's schedule
    prisma.booking.findMany({
      where: {
        providerId: providerProfileId,
        scheduledStart: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
      include: {
        requester: {
          select: { fullName: true },
        },
        category: {
          select: { name: true, iconName: true },
        },
      },
      orderBy: { scheduledStart: 'asc' },
    }),
  ])

  const completionDenominator = completedBookings + cancelledBookings
  const completionRate =
    completionDenominator === 0
      ? 100
      : (completedBookings / completionDenominator) * 100

  const todaySchedule: TodayBooking[] = todayBookings.map((booking) => ({
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    scheduledStart: booking.scheduledStart,
    serviceAddress: booking.serviceAddress,
    requesterNotes: booking.requesterNotes,
    requesterName: booking.requester.fullName,
    categoryName: booking.category.name,
    categoryIcon: booking.category.iconName,
  }))

  return {
    bookingsThisMonth,
    bookingsTotal,
    earningsThisMonth: Number(earningsThisMonthResult._sum.amount ?? 0),
    earningsTotal: Number(earningsTotalResult._sum.amount ?? 0),
    averageRating: Number(providerProfile?.ratingAvg ?? 0),
    totalReviews: providerProfile?.ratingCount ?? 0,
    completionRate,
    pendingRequests,
    todaySchedule,
  }
}
