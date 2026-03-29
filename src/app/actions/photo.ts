'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { isValidUUID } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  uploadProviderPhoto as storageUpload,
  deleteProviderPhoto as storageDelete,
} from '@/services/storage.service'
import type { ProviderPhotoItem, UploadPhotoResult } from '@/types'

// --- Helper ---

async function requireProviderProfile(userId: string): Promise<{ id: string }> {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId, deletedAt: null },
    select: { id: true },
  })
  if (!profile) {
    throw new Error('Provider profile not found. Please register first.')
  }
  return profile
}

// =============================================================================
// Upload Photo
// =============================================================================

export async function uploadPhoto(formData: FormData): Promise<UploadPhotoResult> {
  const authUser = await requireAuthUser()

  const { allowed } = checkRateLimit(`${authUser.id}:uploadPhoto`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  if (!allowed) {
    return { success: false, error: 'Too many uploads. Please wait a moment.' }
  }

  const profile = await requireProviderProfile(authUser.id)

  const file = formData.get('file') as File | null
  const caption = (formData.get('caption') as string)?.trim() || null

  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: 'No file provided.' }
  }

  // Check photo count limit (max 10 per provider)
  const photoCount = await prisma.providerPhoto.count({
    where: { providerId: profile.id },
  })
  if (photoCount >= 10) {
    return { success: false, error: 'Maximum 10 photos allowed. Delete some to upload new ones.' }
  }

  // Upload to Supabase Storage
  const uploadResult = await storageUpload(profile.id, file)
  if (!uploadResult.success || !uploadResult.url) {
    return { success: false, error: uploadResult.error ?? 'Upload failed.' }
  }

  // Save to database
  try {
    const photo = await prisma.providerPhoto.create({
      data: {
        providerId: profile.id,
        url: uploadResult.url,
        caption,
        sortOrder: photoCount, // append to end
      },
      select: {
        id: true,
        url: true,
        caption: true,
        sortOrder: true,
        createdAt: true,
      },
    })

    revalidatePath('/provider/dashboard')
    revalidatePath(`/provider/${profile.id}`)

    return { success: true, photo }
  } catch (error) {
    // Clean up storage if DB save fails
    console.error('[uploadPhoto] DB save failed, cleaning up storage:', error)
    await storageDelete(uploadResult.storagePath!)
    return { success: false, error: 'Failed to save photo. Please try again.' }
  }
}

// =============================================================================
// Delete Photo
// =============================================================================

export async function deletePhoto(
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(photoId)) {
    return { success: false, error: 'Invalid photo ID.' }
  }

  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const photo = await prisma.providerPhoto.findFirst({
    where: { id: photoId, providerId: profile.id },
    select: { id: true, url: true },
  })

  if (!photo) {
    return { success: false, error: 'Photo not found.' }
  }

  // Extract storage path from URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/provider-photos/<path>
  const bucketSegment = '/provider-photos/'
  const pathIndex = photo.url.indexOf(bucketSegment)
  if (pathIndex !== -1) {
    const storagePath = photo.url.substring(pathIndex + bucketSegment.length)
    await storageDelete(storagePath)
  }

  await prisma.providerPhoto.delete({
    where: { id: photoId },
  })

  revalidatePath('/provider/dashboard')
  revalidatePath(`/provider/${profile.id}`)

  return { success: true }
}

// =============================================================================
// Get Provider Photos
// =============================================================================

export async function getProviderPhotos(
  providerId: string
): Promise<ProviderPhotoItem[]> {
  if (!isValidUUID(providerId)) return []

  try {
    const photos = await prisma.providerPhoto.findMany({
      where: { providerId },
      select: {
        id: true,
        url: true,
        caption: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return photos
  } catch (error) {
    console.error('[getProviderPhotos]:', error)
    return []
  }
}

// =============================================================================
// Reorder Photos
// =============================================================================

export async function reorderPhotos(
  photoIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (photoIds.length === 0) {
    return { success: false, error: 'No photos to reorder.' }
  }

  if (!photoIds.every(isValidUUID)) {
    return { success: false, error: 'Invalid photo IDs.' }
  }

  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  // Verify all photos belong to this provider
  const ownedCount = await prisma.providerPhoto.count({
    where: {
      id: { in: photoIds },
      providerId: profile.id,
    },
  })

  if (ownedCount !== photoIds.length) {
    return { success: false, error: 'Some photos do not belong to your profile.' }
  }

  // Batch update sort orders in a transaction
  await prisma.$transaction(
    photoIds.map((id, index) =>
      prisma.providerPhoto.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  )

  revalidatePath('/provider/dashboard')
  revalidatePath(`/provider/${profile.id}`)

  return { success: true }
}
