'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import LocationSearch, { type SelectedLocation } from '@/components/ui/LocationSearch'

interface SearchFiltersProps {
  categorySlug: string | undefined
  currentSearch: string | undefined
  currentAvailableToday?: boolean
  currentNearMe?: boolean
}

export default function SearchFilters({
  categorySlug,
  currentSearch,
  currentAvailableToday,
  currentNearMe,
}: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)
  const [availableToday, setAvailableToday] = useState(currentAvailableToday ?? false)

  function buildParams(overrides: Record<string, string | undefined> = {}): string {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    const search = overrides.search ?? searchRef.current?.value.trim()
    if (search) params.set('search', search)
    const avail = overrides.availableToday ?? (availableToday ? '1' : '')
    if (avail) params.set('availableToday', avail)
    if (overrides.lat) params.set('lat', overrides.lat)
    if (overrides.lng) params.set('lng', overrides.lng)
    if (overrides.nearMe) params.set('nearMe', '1')
    return params.toString()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    router.push(`/browse?${buildParams()}`)
  }

  function handleReset(): void {
    setAvailableToday(false)
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    router.push(`/browse?${params.toString()}`)
  }

  function handleLocationSelect(loc: SelectedLocation): void {
    router.push(`/browse?${buildParams({
      lat: loc.lat.toFixed(6),
      lng: loc.lng.toFixed(6),
      nearMe: '1',
    })}`)
  }

  const hasActiveFilters = currentSearch || currentAvailableToday || currentNearMe

  // Derive the current location label from URL (for display when page reloads)
  // SearchFilters doesn't receive it directly but we can show "Near you" in LocationSearch
  const currentLocationLabel = currentNearMe ? 'Near you' : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {/* Name / service search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          name="search"
          defaultValue={currentSearch ?? ''}
          placeholder="Search by name or service..."
          className="w-full pl-10 pr-4 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      {/* Location search — Ola-style */}
      <LocationSearch
        placeholder="Where do you need service?"
        onSelect={handleLocationSelect}
        initialValue={currentLocationLabel}
      />

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold font-body rounded-xl hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          Search
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            const next = !availableToday
            setAvailableToday(next)
            const params = new URLSearchParams()
            if (categorySlug) params.set('category', categorySlug)
            const search = searchRef.current?.value.trim()
            if (search) params.set('search', search)
            if (next) params.set('availableToday', '1')
            if (currentNearMe) {
              const existingLat = searchParams.get('lat')
              const existingLng = searchParams.get('lng')
              if (existingLat) params.set('lat', existingLat)
              if (existingLng) params.set('lng', existingLng)
              params.set('nearMe', '1')
            }
            router.push(`/browse?${params.toString()}`)
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-body transition-colors ${
            availableToday
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${availableToday ? 'bg-on-primary' : 'bg-outline'}`} />
          Available Today
        </button>
      </div>
    </form>
  )
}
