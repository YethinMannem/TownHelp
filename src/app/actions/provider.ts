'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createProviderProfile(formData: FormData): Promise<void> {
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
    throw new Error('User profile not found. Please sign out and sign in again.')
  }

  const existingProfile = await prisma.providerProfile.findUnique({
    where: { userId: dbUser.id, deletedAt: null },
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
        userId: dbUser.id,
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

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: dbUser.id, deletedAt: null },
    select: { id: true },
  })

  if (!profile) {
    redirect('/provider/register')
  }

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
