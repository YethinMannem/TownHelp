'use client'

import { useState } from 'react'
import { addProviderService } from '@/app/actions/provider'
import { CATEGORY_ICONS } from '@/lib/constants'
import type { ServiceCategoryItem } from '@/types'

export default function AddServiceForm({ categories }: { categories: ServiceCategoryItem[] }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    try {
      await addProviderService(formData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Category *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedCategory === cat.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="categoryId"
                value={cat.id}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="sr-only"
              />
              <span className="text-xl">{CATEGORY_ICONS[cat.slug] || '📋'}</span>
              <span className="text-sm font-medium text-gray-800">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="customRate" className="block text-sm font-medium text-gray-700 mb-1">
          Your Rate (₹)
        </label>
        <input
          type="number"
          id="customRate"
          name="customRate"
          min="50"
          placeholder="e.g. 500"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label htmlFor="rateType" className="block text-sm font-medium text-gray-700 mb-1">
          Rate Type
        </label>
        <select
          id="rateType"
          name="rateType"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="HOURLY">Per Hour</option>
          <option value="PER_VISIT">Per Visit</option>
          <option value="FIXED">Fixed Price</option>
          <option value="PER_KG">Per Kg</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Service Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="What is included? Any specialties?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !selectedCategory}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding Service...' : 'Add Service'}
      </button>

      <a
        href="/provider/dashboard"
        className="block text-center text-sm text-gray-500 hover:text-gray-700"
      >
        Skip - go to dashboard
      </a>
    </form>
  )
}