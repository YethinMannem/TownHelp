'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { transitionBookingStatus, computeBookingActions } from '@/services/booking.service'
import { confirmOfflinePayment } from '@/services/payment.service'
import { isValidUUID } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getProviderDashboardStats as fetchDashboardStats } from '@/services/dashboard.service'
import type {
  ServiceCategoryItem,
  ProviderListItem,
  ProviderDashboard,
  MyBookings,
  BookingTransitionResult,
  ProviderDashboardStats,
} from '@/types'

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

    return categories.map((c) => ({
      ...c,
      sortOrder: c.sortOrder,
    }))
  } catch (error) {
    console.error('[getServiceCategories]:', error)
    return []
  }
}

interface GetProvidersFilters {
  categorySlug?: string
  search?: string
  area?: string
  page?: number
  limit?: number
}

// Public action — provider discovery data
export async function getProviders(
  categorySlugOrFilters?: string | GetProvidersFilters,
): Promise<ProviderListItem[]> {
  // Accept either the legacy positional string or the new filters object
  const filters: GetProvidersFilters =
    typeof categorySlugOrFilters === 'string'
      ? { categorySlug: categorySlugOrFilters }
      : (categorySlugOrFilters ?? {})

  const { categorySlug, search, area } = filters

  const pageSize = Math.min(filters.limit ?? 20, 50) // Max 50 per page
  const page = Math.max(filters.page ?? 1, 1)
  const skip = (page - 1) * pageSize

  try {
    const providers = await prisma.providerProfile.findMany({
      where: {
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
            { displayName: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(area && {
          serviceAreas: {
            some: { areaName: { contains: area, mode: 'insensitive' } },
          },
        }),
      },
      select: {
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
        user: {
          select: { fullName: true },
        },
        services: {
          where: {
            isActive: true,
            ...(categorySlug && {
              category: { slug: categorySlug },
            }),
          },
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
      },
      take: pageSize,
      skip,
      orderBy: { ratingAvg: 'desc' },
    })

    return providers.map((p) => ({
      ...p,
      baseRate: Number(p.baseRate),
      ratingAvg: Number(p.ratingAvg),
      services: p.services.map((s) => ({
        ...s,
        customRate: s.customRate ? Number(s.customRate) : null,
      })),
      areas: p.serviceAreas,
    }))
  } catch (error) {
    console.error('[getProviders]:', error)
    return []
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

  const serviceAddress = rawAddress.slice(0, 500)
  const notes = rawNotes.slice(0, 1000)
  const quotedRate = isNaN(rawRate) || rawRate < 0 ? NaN : rawRate

  if (!isValidUUID(providerId) || !isValidUUID(categoryId)) {
    throw new Error('Provider and service category are required.')
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId, deletedAt: null },
    select: {
      userId: true,
      serviceAreas: {
        where: { city: 'Hyderabad' },
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
    throw new Error('Provider not found.')
  }

  if (provider.userId === authUser.id) {
    throw new Error('You cannot book yourself.')
  }

  if (provider.serviceAreas.length === 0) {
    throw new Error('This provider does not operate in Hyderabad.')
  }

  if (provider.services.length === 0) {
    throw new Error('This provider does not offer the selected service.')
  }

  // Retry on booking number collision (extremely unlikely but handled)
  const MAX_RETRIES = 3
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const now = new Date()
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
    const uniqueId = crypto.randomUUID().slice(0, 8).toUpperCase()
    const bookingNumber = `TH-${dateStr}-${uniqueId}`

    try {
      // Transactional: booking + audit log + conversation succeed or fail together
      await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            bookingNumber,
            requesterId: authUser.id,
            providerId,
            categoryId,
            status: 'PENDING',
            serviceAddress: serviceAddress || null,
            requesterNotes: notes || null,
            quotedRate: isNaN(quotedRate) ? null : quotedRate,
          },
          select: { id: true },
        })

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
      const isUniqueViolation =
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'

      if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
        continue // Retry with new booking number
      }
      throw new Error('Failed to create booking. Please try again.')
    }
  }

  redirect('/bookings')
}

export async function getMyBookings(): Promise<MyBookings> {
  const authUser = await requireAuthUser()

  const bookingSelect = {
    id: true,
    bookingNumber: true,
    status: true,
    quotedRate: true,
    finalAmount: true,
    serviceAddress: true,
    requesterNotes: true,
    createdAt: true,
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
          select: { displayName: true, userId: true },
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
      bookingNumber: b.bookingNumber,
      status: b.status,
      quotedRate: b.quotedRate ? Number(b.quotedRate) : null,
      finalAmount: b.finalAmount ? Number(b.finalAmount) : null,
      serviceAddress: b.serviceAddress,
      requesterNotes: b.requesterNotes,
      createdAt: b.createdAt,
      confirmedAt: b.confirmedAt,
      completedAt: b.completedAt,
      cancelledAt: b.cancelledAt,
      provider: { displayName: b.provider.displayName, userId: b.provider.userId },
      category: b.category,
      actions: computeBookingActions(b.status, authUser.id, b.requesterId, b.provider.userId, b.payment?.status ?? undefined),
      hasReview: b.review !== null,
      paymentStatus: b.payment?.status ?? 'NONE',
    })),
    asProvider: asProviderRaw.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      quotedRate: b.quotedRate ? Number(b.quotedRate) : null,
      finalAmount: b.finalAmount ? Number(b.finalAmount) : null,
      serviceAddress: b.serviceAddress,
      requesterNotes: b.requesterNotes,
      createdAt: b.createdAt,
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
  if (result.success) revalidatePath('/bookings')
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

export async function startBooking(bookingId: string): Promise<BookingTransitionResult> {
  if (!isValidUUID(bookingId)) return { success: false, error: 'Invalid booking ID.' }
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'IN_PROGRESS', userId)
  if (result.success) revalidatePath('/bookings')
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
    },
  })

  if (!profile) return null

  return {
    ...profile,
    baseRate: Number(profile.baseRate),
    ratingAvg: Number(profile.ratingAvg),
    services: profile.services.map((s) => ({
      ...s,
      customRate: s.customRate ? Number(s.customRate) : null,
    })),
    areas: profile.serviceAreas,
  }
}
