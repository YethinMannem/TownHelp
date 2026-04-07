import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export const authService = {
  /**
   * Sign up with email and password.
   * Supabase creates the user and sends a verification email.
   * Returns user but NO session — user must verify email first.
   */
  async signUp(email: string, password: string, fullName: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  /**
   * Sign in with email and password.
   * Only works after email is verified.
   * Returns session directly — no redirect needed.
   */
  async signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  /**
   * Resend the verification email for an unverified account.
   * Uses Supabase OTP resend with email type.
   */
  async resendVerificationEmail(email: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  /**
   * Send a password reset email.
   * User clicks the link → redirected to /auth/callback?next=/login/reset-password.
   */
  async resetPassword(email: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/login/reset-password`,
    })
    return { data, error }
  },

  /**
   * Update password for the currently authenticated user.
   * Called after the user clicks the reset link and is redirected back.
   */
  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  },

  /**
   * Sign out — clears session and cookies.
   */
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Get current user (client-side).
   */
  async getUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  /**
   * Listen to auth state changes (login, logout, token refresh).
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange(callback)
  },
}
