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

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('exchangeCodeForSession failed:', error.message)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      const syncResult = await syncUserOnLogin()
      if (!syncResult.success) {
        console.error('User sync failed in callback:', syncResult.error)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
