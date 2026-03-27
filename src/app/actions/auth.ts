'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

interface SyncResult {
  success: boolean
  error?: string
}

/**
 * Syncs the authenticated Supabase user to public.users via Prisma.
 * Call after signIn/signUp on the password path (callback route
 * handles the email-confirmation path separately).
 */
export async function syncUserOnLogin(): Promise<SyncResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No authenticated user' }
    }

    const provider = user.app_metadata?.provider || 'email'
    const authProvider = provider === 'google'
      ? 'GOOGLE'
      : provider === 'phone'
        ? 'PHONE'
        : 'EMAIL' as const

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email || null,
        phone: user.phone || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        isEmailVerified: !!user.email_confirmed_at,
        isPhoneVerified: !!user.phone_confirmed_at,
        lastLoginAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email || null,
        phone: user.phone || null,
        fullName: user.user_metadata?.full_name || 'TownHelp User',
        avatarUrl: user.user_metadata?.avatar_url || null,
        authProvider,
        isEmailVerified: !!user.email_confirmed_at,
        isPhoneVerified: !!user.phone_confirmed_at,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to sync user on login:', error)
    return { success: false, error: 'Sync failed' }
  }
}
