'use client'

import { useState } from 'react'
import Link from 'next/link'
import { addProviderService } from '@/app/actions/provider'
import { CATEGORY_LUCIDE_ICONS } from '@/lib/constants'
import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-error-container rounded-2xl text-on-error-container font-body text-sm">
          {error}
        </div>
      )}

      {/* Category picker */}
      <div>
        <p className="font-body text-sm font-medium text-on-surface-variant mb-2">
          Service Category *
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories.map((cat) => {
            const Icon = CATEGORY_LUCIDE_ICONS[cat.slug] ?? LayoutGrid
            const isSelected = selectedCategory === cat.id
            return (
              <label
                key={cat.id}
                className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary-fixed'
                    : 'border-outline-variant bg-surface-container hover:border-outline'
                }`}
              >
                <input
                  type="radio"
                  name="categoryId"
                  value={cat.id}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="sr-only"
                />
                <Icon
                  className={`w-5 h-5 shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}
                />
                <span
                  className={`font-body text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-on-surface'
                  }`}
                >
                  {cat.name}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <Input
        id="customRate"
        name="customRate"
        type="number"
        label="Your Rate (₹)"
        min="50"
        placeholder="e.g. 500"
      />

      {/* Rate type select — styled to match Input */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="rateType"
          className="text-sm font-medium text-on-surface-variant font-body"
        >
          Rate Type
        </label>
        <select
          id="rateType"
          name="rateType"
          className="w-full rounded-xl border border-outline-variant px-4 py-3 text-base font-body text-on-surface bg-surface-container-lowest transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="HOURLY">Per Hour</option>
          <option value="PER_VISIT">Per Visit</option>
          <option value="FIXED">Fixed Price</option>
          <option value="PER_KG">Per Kg</option>
        </select>
      </div>

      {/* Description textarea */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-medium text-on-surface-variant font-body"
        >
          Service Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="What is included? Any specialties?"
          className="w-full rounded-xl border border-outline-variant px-4 py-3 text-base font-body text-on-surface placeholder:text-outline bg-surface-container-lowest transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
        />
      </div>

      <Button
        type="submit"
        loading={loading}
        disabled={loading || !selectedCategory}
        className="w-full"
        size="lg"
      >
        {loading ? 'Adding Service...' : 'Add Service'}
      </Button>

      <Link
        href="/provider/dashboard"
        className="block text-center font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        Skip — go to dashboard
      </Link>
    </form>
  )
}
