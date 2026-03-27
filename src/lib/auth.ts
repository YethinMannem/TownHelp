import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  supabaseId: string
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
