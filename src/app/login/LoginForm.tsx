'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [formState, setFormState] = useState<FormState>({ kind: 'idle' })
  const searchParams = useSearchParams()
  const router = useRouter()

  function getRedirectPath(): string {
    return searchParams.get('role') === 'provider' ? '/provider/dashboard' : '/'
  }

  const authError = searchParams.get('error')
  const isLoading = formState.kind === 'loading'
  const showForm = formState.kind !== 'verify' && formState.kind !== 'resent'

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
        // Standard flow: email confirmation required
        setFormState({ kind: 'verify', email: trimmedEmail })
      } else if (data.session) {
        // Edge case: confirmation disabled in Supabase dashboard
        const syncResult = await syncUserOnLogin()
        if (!syncResult.success) {
          setFormState({ kind: 'error', message: 'Account created but setup failed. Please try signing in again.' })
          return
        }
        router.push(getRedirectPath())
      }
    } else {
      const { data, error } = await authService.signIn(trimmedEmail, password)

      if (error) {
        // Supabase returns this when user hasn't verified their email
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
        router.push(getRedirectPath())
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

  // Email verification pending screen
  if (formState.kind === 'verify') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-lg bg-blue-50 border border-blue-200 text-center">
          <div className="text-3xl mb-3">&#9993;</div>
          <h2 className="text-lg font-semibold text-blue-900">Verify your email</h2>
          <p className="mt-2 text-sm text-blue-700">
            We sent a verification link to <strong>{formState.email}</strong>.
            Click the link in your email to activate your account.
          </p>
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the email? Check your spam folder, or
          </p>
          <button
            type="button"
            onClick={handleResendVerification}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Resend verification email
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFormState({ kind: 'idle' })}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
        <div className="p-6 rounded-lg bg-green-50 border border-green-200 text-center">
          <div className="text-3xl mb-3">&#10003;</div>
          <h2 className="text-lg font-semibold text-green-900">Email resent</h2>
          <p className="mt-2 text-sm text-green-700">
            A new verification link has been sent. Please check your inbox.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormState({ kind: 'idle' })}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to sign in
        </button>
      </div>
    )
  }

  return (
    <>
      {authError && formState.kind === 'idle' && (
        <div className="p-4 rounded-lg text-sm text-center bg-red-50 text-red-700 border border-red-200">
          {authError === 'auth_failed'
            ? 'Sign in failed. The link may have expired — please try again.'
            : 'Something went wrong. Please try again.'}
        </div>
      )}

      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => { setIsNewUser(false); setFormState({ kind: 'idle' }); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            !isNewUser
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsNewUser(true); setFormState({ kind: 'idle' }); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            isNewUser
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isNewUser && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
            className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading
            ? (isNewUser ? 'Creating account...' : 'Signing in...')
            : (isNewUser ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      {formState.kind === 'error' && (
        <div className="p-4 rounded-lg text-sm text-center bg-red-50 text-red-700 border border-red-200">
          <p>{formState.message}</p>
        </div>
      )}
    </>
  )
}
