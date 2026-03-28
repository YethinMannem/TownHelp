'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

const HYDERABAD_AREAS = [
  'Madhapur',
  'Gachibowli',
  'Kondapur',
  'Kukatpally',
  'HITEC City',
  'Jubilee Hills',
  'Banjara Hills',
] as const

interface SearchFiltersProps {
  categorySlug: string | undefined
  currentSearch: string | undefined
  currentArea: string | undefined
}

export default function SearchFilters({
  categorySlug,
  currentSearch,
  currentArea,
}: SearchFiltersProps) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const areaRef = useRef<HTMLSelectElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    const search = searchRef.current?.value.trim()
    if (search) params.set('search', search)
    const area = areaRef.current?.value
    if (area) params.set('area', area)
    router.push(`/browse?${params.toString()}`)
  }

  function handleReset(): void {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    router.push(`/browse?${params.toString()}`)
  }

  const hasActiveFilters = currentSearch || currentArea

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="search-input" className="sr-only">
            Search providers by name or description
          </label>
          <input
            id="search-input"
            ref={searchRef}
            type="search"
            name="search"
            defaultValue={currentSearch ?? ''}
            placeholder="Search by name or description..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Search
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label htmlFor="area-select" className="sr-only">
            Filter by neighbourhood
          </label>
          <select
            id="area-select"
            ref={areaRef}
            name="area"
            defaultValue={currentArea ?? ''}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All areas in Hyderabad</option>
            {HYDERABAD_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  )
}
