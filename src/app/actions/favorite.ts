'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { isValidUUID } from '@/lib/validation'
import type { ProviderListItem } from '@/types'

/**
 * Toggle favorite status for a provider.
 * Returns true if now favorited, false if unfavorited.
 */
export async function toggleFavorite(providerId: string): Promise<boolean> {
  if (!isValidUUID(providerId)) return false
  const user = await requireAuthUser()

  // Validate the provider exists and is active
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId, deletedAt: null },
    select: { id: true },
  })

  if (!provider) {
    return false // Provider doesn't exist or was deleted
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_providerId: {
        userId: user.id,
        providerId,
      },
    },
    select: { id: true },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    revalidatePath('/browse')
    revalidatePath('/favorites')
    return false
  }

  try {
    await prisma.favorite.create({
      data: {
        userId: user.id,
        providerId,
      },
    })
  } catch (error: unknown) {
    // Concurrent toggle — another request already created it
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      revalidatePath('/browse')
      revalidatePath('/favorites')
      return true // Already favorited
    }
    throw error
  }

  revalidatePath('/browse')
  revalidatePath('/favorites')
  return true
}

/**
 * Check if the current user has favorited a specific provider.
 */
export async function isFavorited(providerId: string): Promise<boolean> {
  if (!isValidUUID(providerId)) return false
  const user = await requireAuthUser()

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_providerId: {
        userId: user.id,
        providerId,
      },
    },
    select: { id: true },
  })

  return !!existing
}

/**
 * Get all favorited providers for the current user.
 */
export async function getMyFavorites(): Promise<ProviderListItem[]> {
  const user = await requireAuthUser()

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      provider: {
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
            select: {
              fullName: true,
            },
          },
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
            },
          },
        },
      },
    },
  })

  return favorites.map(({ provider: p }) => ({
    id: p.id,
    displayName: p.displayName,
    bio: p.bio,
    baseRate: Number(p.baseRate),
    ratingAvg: Number(p.ratingAvg),
    ratingCount: p.ratingCount,
    completedBookings: p.completedBookings,
    isVerified: p.isVerified,
    availableFrom: p.availableFrom,
    availableTo: p.availableTo,
    user: p.user,
    services: p.services.map((s) => ({
      id: s.id,
      customRate: s.customRate ? Number(s.customRate) : null,
      rateType: s.rateType,
      description: s.description,
      category: s.category,
    })),
    areas: p.serviceAreas,
  }))
}
