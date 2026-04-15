'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchFiltersProps {
  categorySlug: string | undefined
  currentSearch: string | undefined
  currentArea: string | undefined
  areas: string[]
}

export default function SearchFilters({
  categorySlug,
  currentSearch,
  currentArea,
  areas,
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
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-outline" />
        <input
          ref={searchRef}
          type="search"
          name="search"
          defaultValue={currentSearch ?? ''}
          placeholder="Search by name or description..."
          className="w-full pl-10 pr-4 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      {/* Area filter row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          ref={areaRef}
          name="area"
          defaultValue={currentArea ?? ''}
          className="w-full flex-1 px-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none"
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <button
          type="submit"
          className="w-full sm:w-auto shrink-0 px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold font-body rounded-xl hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          Search
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 w-full sm:w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  )
}
