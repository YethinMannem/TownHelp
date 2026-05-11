import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  supabaseId: string
}

export interface ViewerContext {
  user: AuthUser | null
  providerProfileId: string | null
  locationLabel: string | null
  locationLat: number | null
  locationLng: number | null
}

interface ExtractedLocation {
  label: string | null
  lat: number | null
  lng: number | null
}

function readCoordinate(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < min || value > max) return null
  return value
}

function extractLocation(
  metadata: unknown,
  fallbackArea?: { areaName: string; city: string } | null
): ExtractedLocation {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const meta = metadata as Record<string, unknown>
    const raw = meta.locationLabel
    if (typeof raw === 'string' && raw.trim()) {
      return {
        label: raw.trim(),
        lat: readCoordinate(meta.locationLat, -90, 90),
        lng: readCoordinate(meta.locationLng, -180, 180),
      }
    }
  }

  if (fallbackArea?.areaName?.trim() && fallbackArea.city?.trim()) {
    return {
      label: `${fallbackArea.areaName.trim()}, ${fallbackArea.city.trim()}`,
      lat: null,
      lng: null,
    }
  }

  if (fallbackArea?.city?.trim()) {
    return { label: fallbackArea.city.trim(), lat: null, lng: null }
  }

  return { label: null, lat: null, lng: null }
}

/**
 * Cached per-request: creates Supabase client and resolves DB user once.
 * All server actions and pages should use this instead of repeating
 * createClient() + prisma.user.findUnique() everywhere.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id, deletedAt: null },
    select: { id: true },
  })

  if (!dbUser) return null

  return { id: dbUser.id, supabaseId: user.id }
})

export const getViewerContext = cache(async (): Promise<ViewerContext> => {
  const user = await getAuthUser()

  if (!user) {
    return { user: null, providerProfileId: null, locationLabel: null, locationLat: null, locationLng: null }
  }

  const [dbUser, providerProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id, deletedAt: null },
      select: { metadata: true },
    }),
    prisma.providerProfile.findUnique({
      where: { userId: user.id, deletedAt: null },
      select: {
        id: true,
        serviceAreas: {
          select: { areaName: true, city: true },
          orderBy: { isPrimary: 'desc' },
          take: 1,
        },
      },
    }),
  ])

  const primaryArea = providerProfile?.serviceAreas[0] ?? null
  const location = extractLocation(dbUser?.metadata, primaryArea)

  return {
    user,
    providerProfileId: providerProfile?.id ?? null,
    locationLabel: location.label,
    locationLat: location.lat,
    locationLng: location.lng,
  }
})

/**
 * Same as getAuthUser but redirects to /login if not authenticated.
 * Use in server actions and provider pages that require auth.
 */
export async function requireAuthUser(redirectTo = '/login'): Promise<AuthUser> {
  const user = await getAuthUser()

  if (!user) {
    redirect(redirectTo)
  }

  return user
}
