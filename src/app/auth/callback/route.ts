import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const provider = user.app_metadata?.provider || 'email'
        const authProvider = provider === 'google' 
          ? 'GOOGLE' 
          : provider === 'phone' 
            ? 'PHONE' 
            : 'EMAIL'

        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email || null,
            phone: user.phone || null,
            full_name: user.user_metadata?.full_name || 'TownHelp User',
            avatar_url: user.user_metadata?.avatar_url || '',
            auth_provider: authProvider,
            is_email_verified: !!user.email_confirmed_at,
            is_phone_verified: !!user.phone_confirmed_at,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error('Failed to create user profile:', insertError)
          }
        } else {
          await supabase.from('users').update({
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_email_verified: !!user.email_confirmed_at,
          }).eq('id', user.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
