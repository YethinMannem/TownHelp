import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncUserOnLogin } from '@/app/actions/auth'

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  try {
    const code = searchParams.get('code')
    const next = safeRedirectPath(searchParams.get('next'))

    if (!code) {
      console.error('[auth/callback] No code parameter in callback URL')
      return NextResponse.redirect(`${origin}/login?error=missing_code`)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // Supabase returns specific messages we can map to user-friendly errors
      const isExpired = error.message.includes('expired') || error.message.includes('invalid')
      const errorType = isExpired ? 'link_expired' : 'exchange_failed'
      console.error(`[auth/callback] exchangeCodeForSession failed (${errorType}):`, error.message)
      return NextResponse.redirect(`${origin}/login?error=${errorType}`)
    }

    const syncResult = await syncUserOnLogin()
    if (!syncResult.success) {
      console.error('[auth/callback] User sync to public.users failed:', syncResult.error)
      return NextResponse.redirect(`${origin}/login?error=sync_failed`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error('[auth/callback] Unexpected error during auth callback:', error)
    return NextResponse.redirect(`${origin}/login?error=unexpected`)
  }
}
