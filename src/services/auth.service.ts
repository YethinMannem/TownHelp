import { createClient } from '@/lib/supabase/client'

export const authService = {
  /**
   * Sign in or sign up with magic link
   * If the email doesn't exist, Supabase creates the account automatically
   * If it does exist, it sends a login link
   */
  async signInWithMagicLink(email: string, fullName?: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  /**
   * Sign out — clears session and cookies
   */
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Get current user (client-side)
   */
  async getUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  /**
   * Listen to auth state changes (login, logout, token refresh)
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange(callback)
  },
}