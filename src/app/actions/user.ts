'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseCoordinate(value: FormDataEntryValue | null, min: number, max: number): number | null {
  if (typeof value !== 'string' || !value.trim()) return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null

  return parsed
}

interface UpdateProfileResult {
  success: boolean
  error?: string
}

export async function updateProfile(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const authUser = await requireAuthUser()

  const rawName = ((formData.get('fullName') as string | null) ?? '').trim()
  const rawLocation = ((formData.get('locationLabel') as string | null) ?? '').trim()
  const locationLat = parseCoordinate(formData.get('locationLat'), -90, 90)
  const locationLng = parseCoordinate(formData.get('locationLng'), -180, 180)

  if (rawName.length < 2 || rawName.length > 100) {
    return { success: false, error: 'Name must be between 2 and 100 characters.' }
  }

  const locationLabel = rawLocation ? titleCase(rawLocation) : null

  try {
    const current = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { metadata: true },
    })

    const existingMeta =
      current?.metadata &&
      typeof current.metadata === 'object' &&
      !Array.isArray(current.metadata)
        ? (current.metadata as Record<string, unknown>)
        : {}

    const newMeta: Record<string, unknown> = { ...existingMeta }
    if (locationLabel) {
      newMeta.locationLabel = locationLabel
      if (locationLat !== null && locationLng !== null) {
        newMeta.locationLat = locationLat
        newMeta.locationLng = locationLng
      }
    } else {
      delete newMeta.locationLabel
      delete newMeta.locationLat
      delete newMeta.locationLng
    }

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        fullName: rawName,
        metadata: newMeta as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/')
    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('[updateProfile]:', error)
    return { success: false, error: 'Failed to save profile. Please try again.' }
  }
}
