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
  currentLocationLabel?: string
}

export default function SearchFilters({
  categorySlug,
  currentSearch,
  currentAvailableToday,
  currentNearMe,
  currentLocationLabel = '',
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
    const lat = overrides.lat ?? searchParams.get('lat') ?? undefined
    const lng = overrides.lng ?? searchParams.get('lng') ?? undefined
    const nearMe = overrides.nearMe ?? searchParams.get('nearMe') ?? undefined
    const locationLabel = overrides.locationLabel ?? searchParams.get('locationLabel') ?? undefined
    // Preserve current sort unless overridden; drop 'nearest' if location is being cleared
    const sort = overrides.sort ?? (nearMe ? searchParams.get('sort') ?? undefined : undefined)
    if (lat) params.set('lat', lat)
    if (lng) params.set('lng', lng)
    if (nearMe) params.set('nearMe', '1')
    if (locationLabel && nearMe) params.set('locationLabel', locationLabel)
    if (sort) params.set('sort', sort)
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

  function handleLocationClear(): void {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    const search = searchRef.current?.value.trim()
    if (search) params.set('search', search)
    if (availableToday) params.set('availableToday', '1')
    // Carry forward any non-distance sort that was active
    const currentSort = searchParams.get('sort')
    if (currentSort && currentSort !== 'nearest') params.set('sort', currentSort)
    router.push(`/browse?${params.toString()}`)
  }

  function handleLocationSelect(loc: SelectedLocation): void {
    router.push(`/browse?${buildParams({
      lat: loc.lat.toFixed(6),
      lng: loc.lng.toFixed(6),
      nearMe: '1',
      locationLabel: loc.label,
      sort: 'nearest',
    })}`)
  }

  const hasActiveFilters = currentSearch || currentAvailableToday || currentNearMe

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

      {/* Location search — Uber-style */}
      <LocationSearch
        placeholder="Where do you need service?"
        onSelect={handleLocationSelect}
        onClear={handleLocationClear}
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
            router.push(`/browse?${buildParams({ availableToday: next ? '1' : '' })}`)
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
