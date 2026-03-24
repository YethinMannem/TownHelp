'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authService } from '@/services/auth.service'

function getFriendlyError(message: string): string {
  if (message.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (message.includes('invalid')) {
    return 'Please check your email address and try again.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const searchParams = useSearchParams()

  const authError = searchParams.get('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setIsSuccess(false)

    if (isNewUser) {
      const trimmedName = fullName.trim()
      if (trimmedName.length < 2) {
        setMessage('Please enter your full name (at least 2 characters).')
        setIsLoading(false)
        return
      }
    }

    const { error } = await authService.signInWithMagicLink(
      email.trim().toLowerCase(),
      isNewUser ? fullName.trim() : undefined
    )

    if (error) {
      setMessage(getFriendlyError(error.message))
      setIsSuccess(false)
    } else {
      setMessage('Check your email for the magic link!')
      setIsSuccess(true)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">TownHelp</h1>
          <p className="mt-2 text-gray-600">
            Find trusted local services in your neighborhood
          </p>
        </div>

        {authError && !message && (
          <div className="p-4 rounded-lg text-sm text-center bg-red-50 text-red-700 border border-red-200">
            {authError === 'auth_failed'
              ? 'Sign in failed. The link may have expired — please request a new one.'
              : 'Something went wrong. Please try again.'}
          </div>
        )}

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setIsNewUser(false); setMessage(''); setIsSuccess(false); }}
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
            onClick={() => { setIsNewUser(true); setMessage(''); setIsSuccess(false); }}
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div
            className={`p-4 rounded-lg text-sm text-center ${
              isSuccess
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <p>{message}</p>
            {isSuccess && (
              <p className="mt-2 text-green-600 text-xs">
                Don't see it? Check your spam or junk folder.
              </p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Passwordless sign-in powered by magic link
        </p>
      </div>
    </div>
  )
}
