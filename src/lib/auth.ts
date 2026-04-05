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
}

function extractLocationLabel(
  metadata: unknown,
  fallbackArea?: { areaName: string; city: string } | null
): string | null {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const raw = (metadata as Record<string, unknown>).locationLabel
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim()
    }
  }

  if (fallbackArea?.areaName?.trim() && fallbackArea.city?.trim()) {
    return `${fallbackArea.areaName.trim()}, ${fallbackArea.city.trim()}`
  }

  if (fallbackArea?.city?.trim()) {
    return fallbackArea.city.trim()
  }

  return null
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
    return { user: null, providerProfileId: null, locationLabel: null }
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

  return {
    user,
    providerProfileId: providerProfile?.id ?? null,
    locationLabel: extractLocationLabel(dbUser?.metadata, primaryArea),
  }
})

/**
 * Same as getAuthUser but redirects to /login if not authenticated.
 * Use in server actions that require auth.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
