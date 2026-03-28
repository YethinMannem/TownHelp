'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import type { ProviderServiceItem } from '@/types'

// --- Helper ---

async function requireProviderProfile(userId: string): Promise<{ id: string }> {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId, deletedAt: null },
    select: { id: true },
  })
  if (!profile) {
    redirect('/provider/register')
  }
  return profile
}

export async function createProviderProfile(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()

  const existingProfile = await prisma.providerProfile.findUnique({
    where: { userId: authUser.id, deletedAt: null },
    select: { id: true },
  })

  if (existingProfile) {
    redirect('/provider/dashboard')
  }

  const displayName = formData.get('displayName') as string
  const baseRate = parseFloat(formData.get('baseRate') as string)
  const bio = formData.get('bio') as string
  const areaName = formData.get('areaName') as string

  if (!displayName || !baseRate) {
    throw new Error('Display name and base rate are required.')
  }

  // Transactional: profile + service area succeed or fail together
  await prisma.$transaction(async (tx) => {
    const profile = await tx.providerProfile.create({
      data: {
        userId: authUser.id,
        displayName: displayName.trim(),
        baseRate,
        bio: bio?.trim() || null,
        isAvailable: true,
        isVerified: false,
        ratingAvg: 0,
        ratingCount: 0,
        ratingSum: 0,
        completedBookings: 0,
      },
      select: { id: true },
    })

    if (areaName?.trim()) {
      await tx.serviceArea.create({
        data: {
          providerId: profile.id,
          areaName: areaName.trim(),
          city: 'Hyderabad',
          state: 'Telangana',
          isPrimary: true,
        },
      })
    }
  })

  redirect('/provider/add-service')
}

export async function addProviderService(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const categoryId = formData.get('categoryId') as string
  const customRate = parseFloat(formData.get('customRate') as string)
  const rateType = formData.get('rateType') as string
  const description = formData.get('description') as string

  if (!categoryId) {
    throw new Error('Please select a service category.')
  }

  const validRateTypes = ['HOURLY', 'PER_VISIT', 'FIXED', 'PER_KG'] as const
  const resolvedRateType = validRateTypes.includes(rateType as typeof validRateTypes[number])
    ? (rateType as typeof validRateTypes[number])
    : 'HOURLY'

  try {
    await prisma.providerService.create({
      data: {
        providerId: profile.id,
        categoryId,
        customRate: isNaN(customRate) ? null : customRate,
        rateType: resolvedRateType,
        description: description?.trim() || null,
        isActive: true,
      },
    })
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new Error('You already offer this service. Go to your dashboard to edit it.')
    }
    throw new Error('Failed to add service. Please try again.')
  }

  redirect('/provider/dashboard')
}

// --- Profile Editing ---

export async function updateProviderProfile(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const displayName = formData.get('displayName') as string
  const baseRate = parseFloat(formData.get('baseRate') as string)
  const bio = formData.get('bio') as string
  const isAvailable = formData.get('isAvailable') === 'true'

  if (!displayName?.trim() || isNaN(baseRate) || baseRate < 0) {
    throw new Error('Display name and a valid base rate are required.')
  }

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      displayName: displayName.trim(),
      baseRate,
      bio: bio?.trim() || null,
      isAvailable,
    },
  })

  revalidatePath('/provider/dashboard')
  redirect('/provider/dashboard')
}

// --- Service Editing ---

export async function updateProviderService(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const serviceId = formData.get('serviceId') as string
  const customRate = parseFloat(formData.get('customRate') as string)
  const rateType = formData.get('rateType') as string
  const description = formData.get('description') as string

  if (!serviceId) {
    throw new Error('Service ID is required.')
  }

  const validRateTypes = ['HOURLY', 'PER_VISIT', 'FIXED', 'PER_KG'] as const
  const resolvedRateType = validRateTypes.includes(rateType as typeof validRateTypes[number])
    ? (rateType as typeof validRateTypes[number])
    : undefined

  await prisma.providerService.updateMany({
    where: { id: serviceId, providerId: profile.id },
    data: {
      customRate: isNaN(customRate) ? null : customRate,
      ...(resolvedRateType && { rateType: resolvedRateType }),
      description: description?.trim() || null,
    },
  })

  revalidatePath('/provider/dashboard')
  redirect('/provider/dashboard')
}

export async function deactivateProviderService(serviceId: string): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  await prisma.providerService.updateMany({
    where: { id: serviceId, providerId: profile.id },
    data: { isActive: false },
  })

  revalidatePath('/provider/dashboard')
}

export async function reactivateProviderService(serviceId: string): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  await prisma.providerService.updateMany({
    where: { id: serviceId, providerId: profile.id },
    data: { isActive: true },
  })

  revalidatePath('/provider/dashboard')
}

// --- Service Area Management ---

export async function addServiceArea(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const areaName = formData.get('areaName') as string
  const pincode = formData.get('pincode') as string

  if (!areaName?.trim()) {
    throw new Error('Area name is required.')
  }

  await prisma.serviceArea.create({
    data: {
      providerId: profile.id,
      areaName: areaName.trim(),
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: pincode?.trim() || null,
      isPrimary: false,
    },
  })

  revalidatePath('/provider/dashboard')
  redirect('/provider/dashboard')
}

export async function removeServiceArea(areaId: string): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  // Don't allow removing the last area
  const areaCount = await prisma.serviceArea.count({
    where: { providerId: profile.id },
  })

  if (areaCount <= 1) {
    throw new Error('You must have at least one service area.')
  }

  await prisma.serviceArea.deleteMany({
    where: { id: areaId, providerId: profile.id },
  })

  revalidatePath('/provider/dashboard')
}

// --- Public Provider Detail ---

export interface ProviderDetail {
  id: string
  userId: string
  displayName: string
  bio: string | null
  baseRate: number
  ratingAvg: number
  ratingCount: number
  completedBookings: number
  isVerified: boolean
  isAvailable: boolean
  services: ProviderServiceItem[]
  areas: {
    areaName: string
    city: string
    pincode: string | null
    isPrimary: boolean
  }[]
}

export async function getProviderById(id: string): Promise<ProviderDetail | null> {
  await requireAuthUser()

  const profile = await prisma.providerProfile.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      userId: true,
      displayName: true,
      bio: true,
      baseRate: true,
      ratingAvg: true,
      ratingCount: true,
      completedBookings: true,
      isVerified: true,
      isAvailable: true,
      services: {
        where: { isActive: true },
        select: {
          id: true,
          customRate: true,
          rateType: true,
          description: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconName: true,
            },
          },
        },
      },
      serviceAreas: {
        select: {
          areaName: true,
          city: true,
          pincode: true,
          isPrimary: true,
        },
        orderBy: { isPrimary: 'desc' },
      },
    },
  })

  if (!profile) return null

  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    baseRate: Number(profile.baseRate),
    ratingAvg: Number(profile.ratingAvg),
    ratingCount: profile.ratingCount,
    completedBookings: profile.completedBookings,
    isVerified: profile.isVerified,
    isAvailable: profile.isAvailable,
    services: profile.services.map((s) => ({
      id: s.id,
      customRate: s.customRate ? Number(s.customRate) : null,
      rateType: s.rateType,
      description: s.description,
      category: s.category,
    })),
    areas: profile.serviceAreas,
  }
}

export async function toggleAvailability(): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const current = await prisma.providerProfile.findUnique({
    where: { id: profile.id },
    select: { isAvailable: true },
  })

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: { isAvailable: !current?.isAvailable },
  })

  revalidatePath('/provider/dashboard')
}

// --- Availability Hours ---

export async function updateAvailabilityHours(
  availableFrom: string,
  availableTo: string,
): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  // Validate HH:MM format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(availableFrom) || !timeRegex.test(availableTo)) {
    throw new Error('Invalid time format. Use HH:MM (24-hour).')
  }

  // Store times as DateTime using a fixed epoch date (time component only matters)
  // Prisma @db.Time() stores only the time part; using 1970-01-01 as the date carrier.
  const fromDate = new Date(`1970-01-01T${availableFrom}:00.000Z`)
  const toDate = new Date(`1970-01-01T${availableTo}:00.000Z`)

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      availableFrom: fromDate,
      availableTo: toDate,
    },
  })

  revalidatePath('/provider/dashboard')
  revalidatePath('/provider/availability')
}
