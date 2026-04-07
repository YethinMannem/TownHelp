'use client'

import { useState } from 'react'
import { authService } from '@/services/auth.service'

type FormState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success' }

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formState, setFormState] = useState<FormState>({ kind: 'idle' })

  const isLoading = formState.kind === 'loading'

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()

    if (password !== confirmPassword) {
      setFormState({ kind: 'error', message: 'Passwords do not match.' })
      return
    }

    if (password.length < 6) {
      setFormState({ kind: 'error', message: 'Password must be at least 6 characters.' })
      return
    }

    setFormState({ kind: 'loading' })

    const { error } = await authService.updatePassword(password)

    if (error) {
      setFormState({ kind: 'error', message: error.message.includes('session')
        ? 'Your reset link has expired. Please request a new one.'
        : 'Something went wrong. Please try again.'
      })
    } else {
      setFormState({ kind: 'success' })
    }
  }

  if (formState.kind === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="p-6 rounded-2xl bg-primary-fixed border border-outline-variant/20 text-center">
            <div className="text-3xl mb-3">&#10003;</div>
            <h2 className="text-lg font-semibold text-on-primary-fixed font-headline">Password updated</h2>
            <p className="mt-2 text-sm text-on-primary-fixed/80 font-body">
              Your password has been reset successfully.
            </p>
          </div>

          <a
            href="/login"
            className="block w-full py-3 px-4 rounded-xl text-sm font-semibold font-body text-on-primary bg-brand-gradient shadow-sm hover:opacity-90 active:opacity-80 text-center transition-all"
          >
            Sign in with new password
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-on-surface font-headline">TownHelp</h1>
          <p className="mt-2 text-on-surface-variant font-body text-sm">
            Set a new password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-on-surface font-body">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="mt-1.5 block w-full px-3.5 py-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-body text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-on-surface font-body">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={6}
              className="mt-1.5 block w-full px-3.5 py-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-body text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold font-body text-on-primary bg-brand-gradient shadow-sm hover:opacity-90 active:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {formState.kind === 'error' && (
          <div className="p-4 rounded-xl text-sm text-center bg-error-container text-on-error-container border border-outline-variant/20 font-body">
            <p>{formState.message}</p>
          </div>
        )}

        <a
          href="/login"
          className="block w-full py-2 text-sm text-center text-on-surface-variant hover:text-on-surface transition-colors font-body"
        >
          &larr; Back to sign in
        </a>
      </div>
    </div>
  )
}
