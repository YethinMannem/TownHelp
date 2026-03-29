import { createClient } from '@/lib/supabase/server'

// =============================================================================
// Constants
// =============================================================================

const PROVIDER_PHOTOS_BUCKET = 'provider-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

type AllowedMimeType = (typeof ALLOWED_TYPES)[number]

// Map MIME types to file extensions
const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// =============================================================================
// Result types
// =============================================================================

interface UploadPhotoResult {
  success: boolean
  url?: string
  storagePath?: string
  error?: string
}

interface DeletePhotoResult {
  success: boolean
  error?: string
}

// =============================================================================
// Helpers
// =============================================================================

function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_TYPES as readonly string[]).includes(mimeType)
}

// =============================================================================
// uploadProviderPhoto
// =============================================================================

/**
 * Validates and uploads a provider photo to Supabase Storage.
 * Returns the public URL and storage path on success so the caller can
 * persist the path in the database for later deletion.
 */
export async function uploadProviderPhoto(
  providerId: string,
  file: File
): Promise<UploadPhotoResult> {
  try {
    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File exceeds the 5 MB size limit.' }
    }

    // 2. Validate MIME type
    if (!isAllowedMimeType(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      }
    }

    const extension = MIME_TO_EXT[file.type]
    const storagePath = `${providerId}/${crypto.randomUUID()}.${extension}`

    // 3. Upload to Supabase Storage
    const supabase = await createClient()

    const { error: uploadError } = await supabase.storage
      .from(PROVIDER_PHOTOS_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[uploadProviderPhoto] upload failed:', uploadError)
      return { success: false, error: 'Failed to upload photo. Please try again.' }
    }

    // 4. Retrieve public URL (synchronous — no network call)
    const { data: urlData } = supabase.storage
      .from(PROVIDER_PHOTOS_BUCKET)
      .getPublicUrl(storagePath)

    return { success: true, url: urlData.publicUrl, storagePath }
  } catch (error) {
    console.error('[uploadProviderPhoto] unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred during upload.' }
  }
}

// =============================================================================
// deleteProviderPhoto
// =============================================================================

/**
 * Removes a previously uploaded provider photo from Supabase Storage.
 * Pass the storagePath returned by uploadProviderPhoto.
 */
export async function deleteProviderPhoto(
  storagePath: string
): Promise<DeletePhotoResult> {
  try {
    const supabase = await createClient()

    const { error: deleteError } = await supabase.storage
      .from(PROVIDER_PHOTOS_BUCKET)
      .remove([storagePath])

    if (deleteError) {
      console.error('[deleteProviderPhoto] delete failed:', deleteError)
      return { success: false, error: 'Failed to delete photo. Please try again.' }
    }

    return { success: true }
  } catch (error) {
    console.error('[deleteProviderPhoto] unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred during deletion.' }
  }
}
