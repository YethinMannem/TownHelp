'use server'

import { prisma } from '@/lib/prisma'
import { requireAuthUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminProviderItem {
  id: string
  displayName: string
  bio: string | null
  isVerified: boolean
  isAvailable: boolean
  verifiedAt: Date | null
  createdAt: Date
  user: {
    email: string | null
    phone: string | null
  }
  services: Array<{ categoryName: string }>
  areas: Array<{ areaName: string }>
}

export interface AdminActionResult {
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Guard: called inside every action so the admin check cannot be skipped
// even if the layout is somehow bypassed.
// ---------------------------------------------------------------------------

async function requireAdminUser(): Promise<void> {
  const authUser = await requireAuthUser()

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { email: true },
  })

  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail || dbUser?.email !== adminEmail) {
    throw new Error('Forbidden')
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function getAdminProviders(): Promise<AdminProviderItem[]> {
  try {
    await requireAdminUser()

    const profiles = await prisma.providerProfile.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        bio: true,
        isVerified: true,
        isAvailable: true,
        verifiedAt: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        services: {
          where: { isActive: true },
          select: {
            category: {
              select: { name: true },
            },
          },
        },
        serviceAreas: {
          select: { areaName: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    })

    return profiles.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      bio: p.bio,
      isVerified: p.isVerified,
      isAvailable: p.isAvailable,
      verifiedAt: p.verifiedAt,
      createdAt: p.createdAt,
      user: {
        email: p.user.email,
        phone: p.user.phone,
      },
      services: p.services.map((s) => ({ categoryName: s.category.name })),
      areas: p.serviceAreas.map((a) => ({ areaName: a.areaName })),
    }))
  } catch (error) {
    console.error('[getAdminProviders]:', error)
    return []
  }
}

export async function setProviderVerified(
  providerId: string,
  verified: boolean
): Promise<AdminActionResult> {
  try {
    await requireAdminUser()

    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
      },
    })

    revalidatePath('/admin/providers')

    return { success: true }
  } catch (error) {
    console.error('[setProviderVerified]:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update verification status',
    }
  }
}
