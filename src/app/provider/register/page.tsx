'use client'

import { useState } from 'react'
import { createProviderProfile } from '@/app/actions/provider'
import Link from 'next/link'

export default function RegisterProviderPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    try {
      await createProviderProfile(formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Home
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Become a Provider
        </h1>
        <p className="text-gray-600 mb-6">
          Start offering your services on TownHelp. Fill in the basics — you can update later.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              required
              placeholder="e.g. Ravi's Electrical Services"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">This is what customers will see</p>
          </div>

          <div>
            <label htmlFor="baseRate" className="block text-sm font-medium text-gray-700 mb-1">
              Base Rate (₹/hour) *
            </label>
            <input
              type="number"
              id="baseRate"
              name="baseRate"
              required
              min="50"
              max="10000"
              placeholder="e.g. 300"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">You can set different rates per service later</p>
          </div>

          <div>
            <label htmlFor="areaName" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Service Area
            </label>
            <input
              type="text"
              id="areaName"
              name="areaName"
              placeholder="e.g. Madhapur, Gachibowli"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Short Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="Tell customers about your experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Profile...' : 'Create Provider Profile →'}
          </button>
        </form>
      </div>
    </div>
  )
}
