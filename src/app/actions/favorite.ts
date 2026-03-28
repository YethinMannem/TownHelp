'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import type { ProviderListItem } from '@/types'

/**
 * Toggle favorite status for a provider.
 * Returns true if now favorited, false if unfavorited.
 */
export async function toggleFavorite(providerId: string): Promise<boolean> {
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

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    revalidatePath('/browse')
    revalidatePath('/favorites')
    return false
  }

  await prisma.favorite.create({
    data: {
      userId: user.id,
      providerId,
    },
  })

  revalidatePath('/browse')
  revalidatePath('/favorites')
  return true
}

/**
 * Check if the current user has favorited a specific provider.
 */
export async function isFavorited(providerId: string): Promise<boolean> {
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
          user: {
            select: {
              fullName: true,
              phone: true,
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
