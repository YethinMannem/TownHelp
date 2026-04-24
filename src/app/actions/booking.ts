'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { transitionBookingStatus, computeBookingActions } from '@/services/booking.service'
import { confirmOfflinePayment, finalizeOfflinePayment } from '@/services/payment.service'
import { isValidUUID } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getProviderDashboardStats as fetchDashboardStats } from '@/services/dashboard.service'
import { sendPushToUser } from '@/lib/push'
import { haversineKm } from '@/lib/geo'
import type {
  ServiceCategoryItem,
  ProviderListItem,
  ProviderListResult,
  ProviderSortOption,
  ProviderDashboard,
  MyBookings,
  BookingTransitionResult,
  ProviderDashboardStats,
} from '@/types'

const IST_OFFSET_MS = 330 * 60 * 1000 // UTC+5:30

// Public action — provider discovery data
export async function getServiceCategories(): Promise<ServiceCategoryItem[]> {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        iconName: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return categories
  } catch (error) {
    console.error('[getServiceCategories]:', error)
    return []
  }
}

// Kept for backward compat — callers can migrate away
export async function getServiceAreas(): Promise<string[]> {
  return []
}

interface GetProvidersFilters {
  categorySlug?: string
  search?: string
  area?: string
  lat?: number
  lng?: number
  radiusKm?: number
  sort?: ProviderSortOption
  page?: number
  limit?: number
  availableToday?: boolean
}

// Public action — provider discovery data
const SORT_ORDER_MAP: Record<ProviderSortOption, Record<string, string>> = {
  rating: { ratingAvg: 'desc' },
  price_low: { baseRate: 'asc' },
  price_high: { baseRate: 'desc' },
  experience: { completedBookings: 'desc' },
}

export async function getProviders(
  categorySlugOrFilters?: string | GetProvidersFilters,
): Promise<ProviderListResult> {
  // Accept either the legacy positional string or the new filters object
  const filters: GetProvidersFilters =
    typeof categorySlugOrFilters === 'string'
      ? { categorySlug: categorySlugOrFilters }
      : (categorySlugOrFilters ?? {})

  const { categorySlug, search, area, lat, lng, radiusKm = 5, sort = 'rating', availableToday } = filters
  const nearMe =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180

  const pageSize = Math.min(filters.limit ?? 20, 50) // Max 50 per page
  const page = Math.max(filters.page ?? 1, 1)
  const skip = (page - 1) * pageSize

  const where = {
    isAvailable: true,
    deletedAt: null,
    ...(categorySlug && {
      services: {
        some: {
          isActive: true,
          category: { slug: categorySlug, isActive: true },
        },
      },
    }),
    ...(search && {
      OR: [
        { displayName: { contains: search, mode: 'insensitive' as const } },
        { bio: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(area && {
      serviceAreas: {
        some: { areaName: { contains: area, mode: 'insensitive' as const } },
      },
    }),
    ...(availableToday && {
      availability: {
        some: {
          // Convert to IST (UTC+5:30) before extracting day of week
          dayOfWeek: new Date(Date.now() + IST_OFFSET_MS).getUTCDay(),
          isActive: true,
        },
      },
    }),
  }

  const orderBy = SORT_ORDER_MAP[sort] ?? SORT_ORDER_MAP.rating

  const providerSelect = {
    id: true,
    displayName: true,
    bio: true,
    baseRate: true,
    ratingAvg: true,
    ratingCount: true,
    completedBookings: true,
    isVerified: true,
    availableFrom: true,
    availableTo: true,
    latitude: true,
    longitude: true,
    maxTravelRadiusKm: true,
    user: { select: { fullName: true } },
    services: {
      where: {
        isActive: true,
        ...(categorySlug && { category: { slug: categorySlug } }),
      },
      select: {
        id: true,
        customRate: true,
        rateType: true,
        description: true,
        category: { select: { id: true, name: true, slug: true, iconName: true } },
      },
    },
    serviceAreas: {
      select: { areaName: true, city: true, latitude: true, longitude: true },
    },
  }

  try {
    let totalCount: number
    let rawProviders: Awaited<ReturnType<typeof prisma.providerProfile.findMany<{ select: typeof providerSelect }>>>

    if (nearMe) {
      // Fetch all matching, filter by provider's travel radius from their home location
      rawProviders = await prisma.providerProfile.findMany({ where, select: providerSelect, orderBy })

      rawProviders = rawProviders.filter((p) =>
        p.latitude !== null &&
        p.longitude !== null &&
        haversineKm(lat!, lng!, p.latitude, p.longitude) <= (p.maxTravelRadiusKm ?? 5)
      )

      rawProviders.sort((a, b) => {
        const distA = haversineKm(lat!, lng!, a.latitude!, a.longitude!)
        const distB = haversineKm(lat!, lng!, b.latitude!, b.longitude!)
        return distA - distB
      })

      totalCount = rawProviders.length
      rawProviders = rawProviders.slice(skip, skip + pageSize)
    } else {
      const [fetched, count] = await Promise.all([
        prisma.providerProfile.findMany({ where, select: providerSelect, take: pageSize, skip, orderBy }),
        prisma.providerProfile.count({ where }),
      ])
      rawProviders = fetched
      totalCount = count
    }

    return {
      providers: rawProviders.map((p) => ({
        ...p,
        baseRate: Number(p.baseRate),
        ratingAvg: Number(p.ratingAvg),
        services: p.services.map((s) => ({
          ...s,
          customRate: s.customRate ? Number(s.customRate) : null,
        })),
        areas: p.serviceAreas,
        distanceKm:
          nearMe && p.latitude !== null && p.longitude !== null
            ? haversineKm(lat!, lng!, p.latitude, p.longitude)
            : undefined,
      })),
      totalCount,
    }
  } catch (error) {
    console.error('[getProviders]:', error)
    return { providers: [], totalCount: 0 }
  }
}

export async function createBooking(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()

  const { allowed } = checkRateLimit(`${authUser.id}:createBooking`, {
    maxRequests: 5,
    windowMs: 60_000,
  })
  if (!allowed) {
    throw new Error('Too many booking requests. Please wait a moment.')
  }

  const providerId = formData.get('providerId') as string
  const categoryId = formData.get('categoryId') as string
  const rawAddress = (formData.get('serviceAddress') as string)?.trim() || ''
  const rawNotes = (formData.get('notes') as string)?.trim() || ''
  const rawRate = parseFloat(formData.get('quotedRate') as string)
  const scheduledDate = (formData.get('scheduledDate') as string)?.trim() || ''
  const scheduledStartTime = (formData.get('scheduledStart') as string)?.trim() || ''
  const scheduledEndTime = (formData.get('scheduledEnd') as string)?.trim() || ''

  const serviceAddress = rawAddress.slice(0, 500)
  const notes = rawNotes.slice(0, 1000)
  if (!isNaN(rawRate) && rawRate > 100_000) {
    throw new Error('The quoted rate cannot exceed ₹1,00,000.')
  }
  if (!isNaN(rawRate) && rawRate > 0 && rawRate < 50) {
    throw new Error('The quoted rate must be at least ₹50.')
  }
  const quotedRate = isNaN(rawRate) || rawRate < 0 ? NaN : rawRate

  // Parse scheduled time if provided
  let scheduledStart: Date | null = null
  let scheduledEnd: Date | null = null

  if (scheduledDate && scheduledStartTime && scheduledEndTime) {
    // Times are in IST (UTC+5:30). Subtract 5h30m to store as UTC in the database.
    scheduledStart = new Date(new Date(`${scheduledDate}T${scheduledStartTime}:00.000Z`).getTime() - IST_OFFSET_MS)
    scheduledEnd = new Date(new Date(`${scheduledDate}T${scheduledEndTime}:00.000Z`).getTime() - IST_OFFSET_MS)

    if (isNaN(scheduledStart.getTime()) || isNaN(scheduledEnd.getTime())) {
      throw new Error('Invalid date or time selected. Please try again.')
    }

    if (scheduledStart >= scheduledEnd) {
      throw new Error('Invalid time slot selected.')
    }

    // Don't allow booking in the past
    if (scheduledStart < new Date()) {
      throw new Error('Cannot book a slot in the past. Please select a future time.')
    }
  }

  if (!isValidUUID(providerId) || !isValidUUID(categoryId)) {
    throw new Error('Provider and service category are required.')
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId, deletedAt: null },
    select: {
      userId: true,
      serviceAreas: {
        select: { id: true },
        take: 1,
      },
      services: {
        where: { categoryId, isActive: true },
        select: { id: true },
        take: 1,
      },
    },
  })

  if (!provider) {
    console.error(`[createBooking] Provider not found: ${providerId}`)
    throw new Error('This provider is no longer available. They may have deactivated their profile.')
  }

  if (provider.userId === authUser.id) {
    console.error(`[createBooking] Self-booking attempt by user ${authUser.id}`)
    throw new Error('You cannot book yourself. Please select a different provider.')
  }

  if (provider.serviceAreas.length === 0) {
    console.error(`[createBooking] Provider ${providerId} has no service areas configured`)
    throw new Error('This provider does not currently have any service areas configured.')
  }

  if (provider.services.length === 0) {
    console.error(`[createBooking] Provider ${providerId} does not offer category ${categoryId}`)
    throw new Error('This provider does not offer the service you selected. They may have updated their services.')
  }

  // Retry on booking number collision (extremely unlikely but handled)
  const MAX_RETRIES = 3
  let createdBookingId: string | null = null
  let createdBookingNumber: string | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const now = new Date()
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
    const uniqueId = crypto.randomUUID().slice(0, 8).toUpperCase()
    const bookingNumber = `TH-${dateStr}-${uniqueId}`

    try {
      // Transactional: conflict check + booking + audit log + conversation succeed or fail together.
      // Conflict check is inside the transaction so it cannot race with a concurrent booking creation.
      await prisma.$transaction(async (tx) => {
        if (scheduledStart && scheduledEnd) {
          const conflicting = await tx.booking.findFirst({
            where: {
              providerId,
              status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
              scheduledStart: { lt: scheduledEnd },
              scheduledEnd: { gt: scheduledStart },
            },
            select: { id: true },
          })
          if (conflicting) {
            throw new Error('This time slot was just booked by someone else. Please pick a different slot.')
          }
        }

        const booking = await tx.booking.create({
          data: {
            bookingNumber,
            requesterId: authUser.id,
            providerId,
            categoryId,
            status: 'PENDING',
            scheduledStart,
            scheduledEnd,
            serviceAddress: serviceAddress || null,
            requesterNotes: notes || null,
            quotedRate: isNaN(quotedRate) ? null : quotedRate,
          },
          select: { id: true },
        })

        createdBookingId = booking.id
        createdBookingNumber = bookingNumber

        await tx.bookingStatusLog.create({
          data: {
            bookingId: booking.id,
            fromStatus: 'PENDING',
            toStatus: 'PENDING',
            changedBy: authUser.id,
            notes: 'Booking created',
          },
        })

        // Create conversation so both parties can chat immediately
        await tx.conversation.create({
          data: {
            bookingId: booking.id,
            requesterId: authUser.id,
            providerId,
          },
        })
      })

      // Success — break out of retry loop
      break
    } catch (error: unknown) {
      const isPrismaError = error instanceof Error && 'code' in error
      const isUniqueViolation = isPrismaError && (error as { code: string }).code === 'P2002'

      if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
        continue // Retry with new booking number
      }
      // Re-throw plain errors as-is — they carry user-facing messages (e.g. slot conflict)
      if (!isPrismaError) throw error
      throw new Error('Failed to create booking. Please try again.')
    }
  }

  try {
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { userId: true, displayName: true },
    })

    if (providerProfile) {
      await prisma.notification.create({
        data: {
          userId: providerProfile.userId,
          channel: 'IN_APP',
          type: 'BOOKING_REQUEST',
          title: 'New Booking Request',
          body: createdBookingNumber
            ? `You have a new booking request for ${createdBookingNumber}.`
            : 'You have a new booking request.',
          data: { bookingId: createdBookingId, providerId, categoryId },
        },
      })

      try {
        await sendPushToUser(providerProfile.userId, {
          title: 'New Booking Request',
          body: 'Someone booked your service on TownHelp.',
          url: '/bookings',
        })
      } catch (pushError) {
        console.error('[createBooking] push notification failed:', pushError)
      }
    }
  } catch (notifError) {
    console.error('[createBooking] notification failed:', notifError)
  }

  redirect(`/bookings/${createdBookingId}?new=1`)
}

export async function getMyBookings(): Promise<MyBookings> {
  const authUser = await requireAuthUser()

  const bookingSelect = {
    id: true,
    conversation: { select: { id: true } },
    bookingNumber: true,
    status: true,
    quotedRate: true,
    finalAmount: true,
    serviceAddress: true,
    requesterNotes: true,
    createdAt: true,
    scheduledStart: true,
    confirmedAt: true,
    completedAt: true,
    cancelledAt: true,
    requesterId: true,
    review: { select: { id: true } },
    payment: { select: { status: true } },
    provider: {
      select: { userId: true },
    },
    category: {
      select: { name: true, iconName: true },
    },
  } as const

  const [asRequester, providerProfile] = await Promise.all([
    prisma.booking.findMany({
      where: { requesterId: authUser.id },
      select: {
        ...bookingSelect,
        provider: {
          select: { id: true, displayName: true, userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.providerProfile.findUnique({
      where: { userId: authUser.id, deletedAt: null },
      select: { id: true },
    }),
  ])

  const asProviderRaw = providerProfile
    ? await prisma.booking.findMany({
        where: { providerId: providerProfile.id },
        select: {
          ...bookingSelect,
          requester: {
            select: { fullName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return {
    asRequester: asRequester.map((b) => ({
      id: b.id,
      conversationId: b.conversation?.id ?? null,
      bookingNumber: b.bookingNumber,
      status: b.status,
      quotedRate: b.quotedRate ? Number(b.quotedRate) : null,
      finalAmount: b.finalAmount ? Number(b.finalAmount) : null,
      serviceAddress: b.serviceAddress,
      requesterNotes: b.requesterNotes,
      createdAt: b.createdAt,
      scheduledAt: b.scheduledStart,
      confirmedAt: b.confirmedAt,
      completedAt: b.completedAt,
      cancelledAt: b.cancelledAt,
      provider: { id: b.provider.id, displayName: b.provider.displayName, userId: b.provider.userId },
      category: b.category,
      actions: computeBookingActions(b.status, authUser.id, b.requesterId, b.provider.userId, b.payment?.status ?? undefined),
      hasReview: b.review !== null,
      paymentStatus: b.payment?.status ?? 'NONE',
    })),
    asProvider: asProviderRaw.map((b) => ({
      id: b.id,
      conversationId: b.conversation?.id ?? null,
      bookingNumber: b.bookingNumber,
      status: b.status,
      quotedRate: b.quotedRate ? Number(b.quotedRate) : null,
      finalAmount: b.finalAmount ? Number(b.finalAmount) : null,
      serviceAddress: b.serviceAddress,
      requesterNotes: b.requesterNotes,
      createdAt: b.createdAt,
      scheduledAt: b.scheduledStart,
      confirmedAt: b.confirmedAt,
      completedAt: b.completedAt,
      cancelledAt: b.cancelledAt,
      requesterId: b.requesterId,
      requester: b.requester,
      category: b.category,
      actions: computeBookingActions(b.status, authUser.id, b.requesterId, b.provider.userId, b.payment?.status ?? undefined),
      paymentStatus: b.payment?.status ?? 'NONE',
    })),
  }
}

// =============================================================================
// Booking Lifecycle Actions
// =============================================================================

export async function confirmBooking(bookingId: string): Promise<BookingTransitionResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'CONFIRMED', userId)
  if (result.success) {
    // Generate a 4-digit job start code (like Urban Company's OTP).
    // Requester shows this to the provider when they arrive — proves physical co-presence.
    // Rejection sampling removes modulo bias: 65 536 is not divisible by 9 000,
    // so naive % would favour the first 2 536 values. Redraw until below the
    // largest multiple of 9 000 that fits in a Uint16.
    const RANGE = 9000
    const CEIL = 65536 - (65536 % RANGE)
    let raw: number
    do { raw = crypto.getRandomValues(new Uint16Array(1))[0] } while (raw >= CEIL)
    const otp = String(1000 + (raw % RANGE))
    await prisma.booking.update({
      where: { id: bookingId },
      data: { startOtp: otp, startOtpGeneratedAt: new Date() },
    })
    revalidatePath('/bookings')
  }
  return result
}

export async function rejectBooking(bookingId: string): Promise<BookingTransitionResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'CANCELLED', userId, {
    notes: 'Rejected by provider',
  })
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function startBooking(bookingId: string, otp: string): Promise<BookingTransitionResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  if (!otp || otp.trim().length !== 4) return { success: false, error: 'Enter the 4-digit job code.' }

  const { id: userId } = await requireAuthUser()

  const { allowed } = checkRateLimit(`${userId}:startBooking:${bookingId}`, {
    maxRequests: 5,
    windowMs: 10 * 60_000, // 5 attempts per 10 minutes per booking
  })
  if (!allowed) return { success: false, error: 'Too many attempts. Please wait before trying again.' }

  // Verify OTP before allowing the transition — requester must share code with provider in person.
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { startOtp: true, startOtpGeneratedAt: true, status: true },
  })
  if (!booking) return { success: false, error: 'Booking not found.' }
  if (booking.status !== 'CONFIRMED') return { success: false, error: 'Booking is not in a confirmable state.' }

  // Expire codes older than 24 h — requester can refresh by reopening the booking detail.
  const OTP_TTL_MS = 24 * 60 * 60_000
  if (
    booking.startOtpGeneratedAt &&
    Date.now() - booking.startOtpGeneratedAt.getTime() > OTP_TTL_MS
  ) {
    return { success: false, error: 'Job code has expired. Ask the customer to refresh their booking page.' }
  }

  if (!booking.startOtp || booking.startOtp !== otp.trim()) {
    return { success: false, error: 'Incorrect job code. Ask the customer for the 4-digit code shown on their app.' }
  }

  const result = await transitionBookingStatus(bookingId, 'IN_PROGRESS', userId)
  if (result.success) {
    // Clear the OTP once used — it's a one-time code.
    await prisma.booking.update({
      where: { id: bookingId },
      data: { startOtp: null, startOtpGeneratedAt: null },
    })
    revalidatePath('/bookings')
  }
  return result
}

export async function completeBooking(
  bookingId: string,
  finalAmount?: number
): Promise<BookingTransitionResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'COMPLETED', userId, {
    finalAmount,
  })
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function disputeBooking(bookingId: string): Promise<BookingTransitionResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'DISPUTED', userId, {
    notes: 'Dispute opened by user',
  })
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function cancelBooking(bookingId: string): Promise<BookingTransitionResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'CANCELLED', userId, {
    notes: 'Cancelled by user',
  })
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function confirmPayment(
  bookingId: string,
  paymentMethod: 'CASH' | 'UPI' = 'CASH'
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const { allowed } = checkRateLimit(`${userId}:confirmPayment`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  if (!allowed) return { success: false, error: 'Too many requests. Please wait.' }
  const result = await confirmOfflinePayment(bookingId, userId, paymentMethod)
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function confirmPaymentReceived(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const { allowed } = checkRateLimit(`${userId}:confirmPaymentReceived`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  if (!allowed) return { success: false, error: 'Too many requests. Please wait.' }
  const result = await finalizeOfflinePayment(bookingId, userId)
  if (result.success) revalidatePath('/bookings')
  return result
}

// =============================================================================
// Provider Dashboard Stats
// =============================================================================

export async function getProviderDashboard(): Promise<ProviderDashboardStats | null> {
  const authUser = await requireAuthUser()

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: authUser.id, deletedAt: null },
    select: { id: true },
  })

  if (!profile) return null

  return fetchDashboardStats(profile.id)
}

// =============================================================================
// Provider Profile
// =============================================================================

export async function getMyProviderProfile(): Promise<ProviderDashboard | null> {
  const authUser = await requireAuthUser()

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: authUser.id, deletedAt: null },
    select: {
      id: true,
      displayName: true,
      bio: true,
      baseRate: true,
      ratingAvg: true,
      ratingCount: true,
      isAvailable: true,
      isVerified: true,
      whatsappOptIn: true,
      user: {
        select: { whatsappNumber: true },
      },
      services: {
        where: { isActive: true },
        select: {
          id: true,
          customRate: true,
          rateType: true,
          description: true,
          category: {
            select: { id: true, name: true, slug: true, iconName: true },
          },
        },
      },
      serviceAreas: {
        select: { areaName: true, city: true },
      },
      _count: { select: { availability: { where: { isActive: true } } } },
    },
  })

  if (!profile) return null

  return {
    ...profile,
    baseRate: Number(profile.baseRate),
    ratingAvg: Number(profile.ratingAvg),
    whatsappOptIn: profile.whatsappOptIn,
    whatsappNumber: profile.user.whatsappNumber,
    services: profile.services.map((s) => ({
      ...s,
      customRate: s.customRate ? Number(s.customRate) : null,
    })),
    areas: profile.serviceAreas,
    activeAvailabilityCount: profile._count.availability,
  }
}

// =============================================================================
// Booking Detail
// =============================================================================

export interface BookingDetail {
  id: string
  bookingNumber: string
  status: import('@/types').BookingStatus
  quotedRate: number | null
  finalAmount: number | null
  serviceAddress: string | null
  requesterNotes: string | null
  scheduledAt: Date | null
  createdAt: Date
  confirmedAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
  conversationId: string | null
  role: 'requester' | 'provider'
  // Phone numbers are never exposed — in-app chat is the communication channel.
  otherParty: {
    name: string
  }
  // Only set when role is 'requester' — used for Book Again link.
  providerProfileId: string | null
  // Only set for the requester when status is CONFIRMED; null otherwise.
  startOtp: string | null
  category: {
    name: string
    iconName: string | null
  }
  actions: import('@/types').BookingActions
  hasReview: boolean
  paymentStatus: 'NONE' | import('@/types').PaymentStatus
}

export async function getBookingById(id: string): Promise<BookingDetail | null> {
  if (!isValidUUID(id)) return null

  const authUser = await requireAuthUser()

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        quotedRate: true,
        finalAmount: true,
        serviceAddress: true,
        requesterNotes: true,
        scheduledStart: true,
        createdAt: true,
        confirmedAt: true,
        completedAt: true,
        cancelledAt: true,
        requesterId: true,
        startOtp: true,
        review: { select: { id: true } },
        payment: { select: { status: true } },
        conversation: { select: { id: true } },
        provider: {
          select: {
            id: true,
            userId: true,
            displayName: true,
          },
        },
        requester: {
          select: {
            fullName: true,
          },
        },
        category: {
          select: { name: true, iconName: true },
        },
      },
    })

    if (!booking) return null

    // Determine viewer role — return null if viewer is neither party
    let role: 'requester' | 'provider'
    if (booking.requesterId === authUser.id) {
      role = 'requester'
    } else if (booking.provider.userId === authUser.id) {
      role = 'provider'
    } else {
      return null
    }

    const otherParty =
      role === 'requester'
        ? { name: booking.provider.displayName }
        : { name: booking.requester.fullName }

    // Only the requester sees the OTP, and only while the booking is CONFIRMED (waiting to start).
    const startOtp =
      role === 'requester' && booking.status === 'CONFIRMED'
        ? (booking.startOtp ?? null)
        : null

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      quotedRate: booking.quotedRate ? Number(booking.quotedRate) : null,
      finalAmount: booking.finalAmount ? Number(booking.finalAmount) : null,
      serviceAddress: booking.serviceAddress,
      requesterNotes: booking.requesterNotes,
      scheduledAt: booking.scheduledStart,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      conversationId: booking.conversation?.id ?? null,
      role,
      otherParty,
      startOtp,
      providerProfileId: role === 'requester' ? booking.provider.id : null,
      category: booking.category,
      actions: computeBookingActions(
        booking.status,
        authUser.id,
        booking.requesterId,
        booking.provider.userId,
        booking.payment?.status ?? undefined,
      ),
      hasReview: booking.review !== null,
      paymentStatus: booking.payment?.status ?? 'NONE',
    }
  } catch (error) {
    console.error('[getBookingById]:', error)
    return null
  }
}

// =============================================================================
// Available Slots — computes open time slots for a provider on a given date
// =============================================================================

export interface TimeSlot {
  start: string   // "HH:MM" 24-hour
  end: string     // "HH:MM" 24-hour
  available: boolean
}

export async function getAvailableSlots(
  providerId: string,
  dateStr: string   // "YYYY-MM-DD"
): Promise<{ slots: TimeSlot[]; error?: string }> {
  if (!isValidUUID(providerId)) {
    return { slots: [], error: 'Invalid provider.' }
  }

  const date = new Date(dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) {
    return { slots: [], error: 'Invalid date.' }
  }

  // Determine day of week (JS: 0=Sun .. 6=Sat)
  const dayOfWeek = date.getDay()

  // Get provider's weekly availability for this day
  const availability = await prisma.providerAvailability.findUnique({
    where: {
      providerId_dayOfWeek: { providerId, dayOfWeek },
    },
  })

  if (!availability || !availability.isActive) {
    return { slots: [] }
  }

  // Extract working hours
  const startHour = availability.startTime instanceof Date
    ? availability.startTime.getUTCHours()
    : 9
  const startMin = availability.startTime instanceof Date
    ? availability.startTime.getUTCMinutes()
    : 0
  const endHour = availability.endTime instanceof Date
    ? availability.endTime.getUTCHours()
    : 17
  const endMin = availability.endTime instanceof Date
    ? availability.endTime.getUTCMinutes()
    : 0

  // Get existing bookings for this provider on this date that occupy time slots
  const dayStart = new Date(dateStr + 'T00:00:00.000Z')
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

  const existingBookings = await prisma.booking.findMany({
    where: {
      providerId,
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      scheduledStart: { gte: dayStart, lte: dayEnd },
    },
    select: {
      scheduledStart: true,
      scheduledEnd: true,
    },
  })

  // Generate 1-hour slots within working hours
  const slots: TimeSlot[] = []
  let h = startHour
  let m = startMin

  while (h < endHour || (h === endHour && m < endMin)) {
    const slotStartH = h
    const slotStartM = m

    // Advance by 1 hour
    let slotEndH = h + 1
    let slotEndM = m

    // Cap at working hours end
    if (slotEndH > endHour || (slotEndH === endHour && slotEndM > endMin)) {
      slotEndH = endHour
      slotEndM = endMin
    }

    // Skip partial slots less than 30 minutes
    const slotDurationMin = (slotEndH - slotStartH) * 60 + (slotEndM - slotStartM)
    if (slotDurationMin < 30) {
      break
    }

    const startStr = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`
    const endStr = `${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}`

    // Check if this slot conflicts with any existing booking
    const slotStart = new Date(`${dateStr}T${startStr}:00.000Z`)
    const slotEnd = new Date(`${dateStr}T${endStr}:00.000Z`)

    const isBooked = existingBookings.some((b) => {
      if (!b.scheduledStart || !b.scheduledEnd) return false
      // Overlap check: booking overlaps slot if it starts before slot ends AND ends after slot starts
      return b.scheduledStart < slotEnd && b.scheduledEnd > slotStart
    })

    slots.push({ start: startStr, end: endStr, available: !isBooked })

    h = slotEndH
    m = slotEndM
  }

  return { slots }
}
