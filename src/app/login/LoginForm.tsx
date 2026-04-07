'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { syncUserOnLogin } from '@/app/actions/auth'

function getFriendlyError(message: string): string {
  if (message.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Your email is not verified yet. Please check your inbox or resend the verification email below.'
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters.'
  }
  if (message.includes('invalid')) {
    return 'Please check your email address and try again.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.'
  }
  return 'Something went wrong. Please try again.'
}

type FormState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'verify'; email: string }
  | { kind: 'resent' }
  | { kind: 'forgot' }
  | { kind: 'reset_sent' }

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [formState, setFormState] = useState<FormState>({ kind: 'idle' })
  const searchParams = useSearchParams()

  function getRedirectPath(): string {
    return searchParams.get('role') === 'provider' ? '/provider/dashboard' : '/'
  }

  function navigateAfterAuth(): void {
    window.location.assign(getRedirectPath())
  }

  const authError = searchParams.get('error')
  const isLoading = formState.kind === 'loading'

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setFormState({ kind: 'loading' })

    const trimmedEmail = email.trim().toLowerCase()

    if (isNewUser) {
      const trimmedName = fullName.trim()
      if (trimmedName.length < 2) {
        setFormState({ kind: 'error', message: 'Please enter your full name (at least 2 characters).' })
        return
      }

      const { data, error } = await authService.signUp(trimmedEmail, password, trimmedName)

      if (error) {
        setFormState({ kind: 'error', message: getFriendlyError(error.message) })
      } else if (data.user && !data.session) {
        if (!data.user.identities || data.user.identities.length === 0) {
          setFormState({
            kind: 'error',
            message: 'An account with this email already exists. Try signing in, or use "Resend verification" if you haven\'t verified yet.',
          })
        } else {
          setFormState({ kind: 'verify', email: trimmedEmail })
        }
      } else if (data.session) {
        const syncResult = await syncUserOnLogin()
        if (!syncResult.success) {
          setFormState({ kind: 'error', message: 'Account created but setup failed. Please try signing in again.' })
          return
        }
        navigateAfterAuth()
      }
    } else {
      const { data, error } = await authService.signIn(trimmedEmail, password)

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setFormState({ kind: 'verify', email: trimmedEmail })
        } else {
          setFormState({ kind: 'error', message: getFriendlyError(error.message) })
        }
      } else if (data.session) {
        const syncResult = await syncUserOnLogin()
        if (!syncResult.success) {
          setFormState({ kind: 'error', message: 'Sign in succeeded but account sync failed. Please try again.' })
          return
        }
        navigateAfterAuth()
      }
    }
  }

  async function handleResendVerification(): Promise<void> {
    if (formState.kind !== 'verify') return
    setFormState({ kind: 'loading' })

    const { error } = await authService.resendVerificationEmail(formState.email)

    if (error) {
      setFormState({ kind: 'error', message: getFriendlyError(error.message) })
    } else {
      setFormState({ kind: 'resent' })
    }
  }

  async function handleForgotPassword(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setFormState({ kind: 'loading' })

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setFormState({ kind: 'error', message: 'Please enter your email address.' })
      return
    }

    const { error } = await authService.resetPassword(trimmedEmail)

    if (error) {
      setFormState({ kind: 'error', message: getFriendlyError(error.message) })
    } else {
      setFormState({ kind: 'reset_sent' })
    }
  }

  // Forgot password form
  if (formState.kind === 'forgot') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-on-surface font-headline">Reset your password</h2>
          <p className="mt-2 text-sm text-on-surface-variant font-body">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label htmlFor="resetEmail" className="block text-sm font-medium text-on-surface font-body">
              Email Address
            </label>
            <input
              id="resetEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1.5 block w-full px-3.5 py-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-body text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold font-body text-on-primary bg-brand-gradient shadow-sm hover:opacity-90 active:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setFormState({ kind: 'idle' })}
          className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body"
        >
          &larr; Back to sign in
        </button>
      </div>
    )
  }

  // Password reset email sent confirmation
  if (formState.kind === 'reset_sent') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-primary-fixed border border-outline-variant/20 text-center">
          <div className="text-3xl mb-3">&#9993;</div>
          <h2 className="text-lg font-semibold text-on-primary-fixed font-headline">Check your email</h2>
          <p className="mt-2 text-sm text-on-primary-fixed/80 font-body">
            If an account exists with that email, we&apos;ve sent a password reset link.
            Check your inbox and spam folder.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormState({ kind: 'idle' })}
          className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body"
        >
          &larr; Back to sign in
        </button>
      </div>
    )
  }

  // Email verification pending screen
  if (formState.kind === 'verify') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-tertiary-fixed border border-outline-variant/20 text-center">
          <div className="text-3xl mb-3">&#9993;</div>
          <h2 className="text-lg font-semibold text-on-tertiary-fixed font-headline">Verify your email</h2>
          <p className="mt-2 text-sm text-on-tertiary-fixed/80 font-body">
            We sent a verification link to <strong>{formState.email}</strong>.
            Click the link in your email to activate your account.
          </p>
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-on-surface-variant font-body">
            Didn&apos;t receive the email? Check your spam folder, or
          </p>
          <button
            type="button"
            onClick={handleResendVerification}
            className="text-sm font-semibold text-primary hover:underline transition-colors font-body"
          >
            Resend verification email
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFormState({ kind: 'idle' })}
          className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body"
        >
          &larr; Back to sign in
        </button>
      </div>
    )
  }

  // Verification email resent confirmation
  if (formState.kind === 'resent') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-primary-fixed border border-outline-variant/20 text-center">
          <div className="text-3xl mb-3">&#10003;</div>
          <h2 className="text-lg font-semibold text-on-primary-fixed font-headline">Email resent</h2>
          <p className="mt-2 text-sm text-on-primary-fixed/80 font-body">
            A new verification link has been sent. Please check your inbox.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormState({ kind: 'idle' })}
          className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body"
        >
          &larr; Back to sign in
        </button>
      </div>
    )
  }

  return (
    <>
      {authError && formState.kind === 'idle' && (
        <div className="p-4 rounded-xl text-sm text-center bg-error-container text-on-error-container border border-outline-variant/20 font-body">
          {authError === 'link_expired'
            ? 'Your verification link has expired. Please sign up again or resend the verification email.'
            : authError === 'exchange_failed'
            ? 'We couldn\'t verify your email link. It may have already been used. Try signing in with your password.'
            : authError === 'sync_failed'
            ? 'Your account was verified but we couldn\'t set up your profile. Please try signing in again.'
            : authError === 'missing_code'
            ? 'Invalid verification link. Please use the latest link from your email.'
            : 'Something went wrong during sign in. Please try again.'}
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex bg-surface-container rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => { setIsNewUser(false); setFormState({ kind: 'idle' }); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 font-body ${
            !isNewUser
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsNewUser(true); setFormState({ kind: 'idle' }); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 font-body ${
            isNewUser
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isNewUser && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-on-surface font-body">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required={isNewUser}
              minLength={2}
              className="mt-1.5 block w-full px-3.5 py-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-body text-sm"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-on-surface font-body">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mt-1.5 block w-full px-3.5 py-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-on-surface font-body">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isNewUser ? 'At least 6 characters' : 'Enter your password'}
            required
            minLength={6}
            className="mt-1.5 block w-full px-3.5 py-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-body text-sm"
          />
        </div>

        {!isNewUser && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => setFormState({ kind: 'forgot' })}
              className="text-sm text-primary hover:underline transition-colors font-body"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold font-body text-on-primary bg-brand-gradient shadow-sm hover:opacity-90 active:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading
            ? (isNewUser ? 'Creating account...' : 'Signing in...')
            : (isNewUser ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      {formState.kind === 'error' && (
        <div className="p-4 rounded-xl text-sm text-center bg-error-container text-on-error-container border border-outline-variant/20 font-body">
          <p>{formState.message}</p>
          {(formState.message.includes('already exists') || formState.message.includes('not verified')) && email.trim() && (
            <button
              type="button"
              onClick={() => setFormState({ kind: 'verify', email: email.trim().toLowerCase() })}
              className="mt-2 text-sm font-semibold text-primary hover:underline transition-colors font-body"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}
    </>
  )
}
