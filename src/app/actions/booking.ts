'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type {
  ServiceCategoryItem,
  ProviderListItem,
  ProviderDashboard,
  MyBookings,
} from '@/types'

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

export async function getProviders(categorySlug?: string): Promise<ProviderListItem[]> {
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id, deletedAt: null },
    select: { id: true },
  })

  if (!dbUser) {
    throw new Error('User not found.')
  }

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
    select: { userId: true },
  })

  if (!provider) {
    throw new Error('Provider not found.')
  }

  if (provider.userId === dbUser.id) {
    throw new Error('You cannot book yourself.')
  }

  const now = new Date()
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
  const uniqueId = crypto.randomUUID().slice(0, 8).toUpperCase()
  const bookingNumber = `TH-${dateStr}-${uniqueId}`

  // Transactional: booking + audit log succeed or fail together
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        requesterId: dbUser.id,
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
        changedBy: dbUser.id,
        notes: 'Booking created by requester',
      },
    })
  })

  redirect('/bookings')
}

export async function getMyBookings(): Promise<MyBookings> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id, deletedAt: null },
    select: { id: true },
  })

  if (!dbUser) return { asRequester: [], asProvider: [] }

  const bookingSelect = {
    id: true,
    bookingNumber: true,
    status: true,
    quotedRate: true,
    serviceAddress: true,
    requesterNotes: true,
    createdAt: true,
    category: {
      select: { name: true, iconName: true },
    },
  } as const

  const asRequester = await prisma.booking.findMany({
    where: { requesterId: dbUser.id },
    select: {
      ...bookingSelect,
      provider: {
        select: { displayName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: dbUser.id, deletedAt: null },
    select: { id: true },
  })

  let asProviderRaw: {
    id: string
    bookingNumber: string
    status: typeof asRequester[number]['status']
    quotedRate: typeof asRequester[number]['quotedRate']
    serviceAddress: string | null
    requesterNotes: string | null
    createdAt: Date
    category: { name: string; iconName: string | null }
    requester: { fullName: string; phone: string | null }
  }[] = []

  if (providerProfile) {
    asProviderRaw = await prisma.booking.findMany({
      where: { providerId: providerProfile.id },
      select: {
        ...bookingSelect,
        requester: {
          select: { fullName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  return {
    asRequester: asRequester.map((b) => ({
      ...b,
      quotedRate: b.quotedRate ? Number(b.quotedRate) : null,
    })),
    asProvider: asProviderRaw.map((b) => ({
      ...b,
      quotedRate: b.quotedRate ? Number(b.quotedRate) : null,
    })),
  }
}

export async function getMyProviderProfile(): Promise<ProviderDashboard | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: user.id, deletedAt: null },
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
