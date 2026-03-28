'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { transitionBookingStatus, computeBookingActions } from '@/services/booking.service'
import type {
  ServiceCategoryItem,
  ProviderListItem,
  ProviderDashboard,
  MyBookings,
  BookingTransitionResult,
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
          select: { fullName: true, phone: true },
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

  const providerId = formData.get('providerId') as string
  const categoryId = formData.get('categoryId') as string
  const serviceAddress = formData.get('serviceAddress') as string
  const notes = formData.get('notes') as string
  const quotedRate = parseFloat(formData.get('quotedRate') as string)

  if (!providerId || !categoryId) {
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

  const now = new Date()
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
  const uniqueId = crypto.randomUUID().slice(0, 8).toUpperCase()
  const bookingNumber = `TH-${dateStr}-${uniqueId}`

  // Transactional: booking + audit log + conversation succeed or fail together
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        requesterId: authUser.id,
        providerId,
        categoryId,
        status: 'PENDING',
        serviceAddress: serviceAddress?.trim() || null,
        requesterNotes: notes?.trim() || null,
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
        notes: 'Booking created by requester',
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
      provider: { displayName: b.provider.displayName },
      category: b.category,
      actions: computeBookingActions(b.status, authUser.id, b.requesterId, b.provider.userId),
      hasReview: b.review !== null,
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
      requester: b.requester,
      category: b.category,
      actions: computeBookingActions(b.status, authUser.id, b.requesterId, b.provider.userId),
    })),
  }
}

// =============================================================================
// Booking Lifecycle Actions
// =============================================================================

export async function confirmBooking(bookingId: string): Promise<BookingTransitionResult> {
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'CONFIRMED', userId)
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function rejectBooking(bookingId: string): Promise<BookingTransitionResult> {
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'CANCELLED', userId, {
    notes: 'Rejected by provider',
  })
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function startBooking(bookingId: string): Promise<BookingTransitionResult> {
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'IN_PROGRESS', userId)
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function completeBooking(
  bookingId: string,
  finalAmount?: number
): Promise<BookingTransitionResult> {
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'COMPLETED', userId, {
    finalAmount,
  })
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function disputeBooking(bookingId: string): Promise<BookingTransitionResult> {
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'DISPUTED', userId, {
    notes: 'Dispute opened by user',
  })
  if (result.success) revalidatePath('/bookings')
  return result
}

export async function cancelBooking(bookingId: string): Promise<BookingTransitionResult> {
  const { id: userId } = await requireAuthUser()
  const result = await transitionBookingStatus(bookingId, 'CANCELLED', userId, {
    notes: 'Cancelled by user',
  })
  if (result.success) revalidatePath('/bookings')
  return result
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
