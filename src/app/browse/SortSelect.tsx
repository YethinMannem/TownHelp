'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

const BASE_SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'experience', label: 'Most Experienced' },
] as const

const NEAREST_OPTION = { value: 'nearest', label: 'Nearest First' } as const

interface SortSelectProps {
  currentSort: string | undefined
  /** Current URL search params to preserve when changing sort */
  searchParams: Record<string, string | undefined>
}

export default function SortSelect({ currentSort, searchParams }: SortSelectProps) {
  const router = useRouter()
  const nearMe = searchParams.nearMe === '1'
  const sortOptions = nearMe ? [NEAREST_OPTION, ...BASE_SORT_OPTIONS] : BASE_SORT_OPTIONS
  const defaultSort = nearMe ? 'nearest' : 'rating'

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const params = new URLSearchParams()
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.search) params.set('search', searchParams.search)
    if (searchParams.area) params.set('area', searchParams.area)
    if (searchParams.availableToday) params.set('availableToday', searchParams.availableToday)
    if (searchParams.lat) params.set('lat', searchParams.lat)
    if (searchParams.lng) params.set('lng', searchParams.lng)
    if (nearMe) params.set('nearMe', '1')
    if (searchParams.locationLabel && nearMe) params.set('locationLabel', searchParams.locationLabel)
    const sort = e.target.value
    if (sort && sort !== defaultSort) params.set('sort', sort)
    // Reset to page 1 when sort changes
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <div className="relative">
      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
      <select
        value={currentSort ?? defaultSort}
        onChange={handleChange}
        className="w-full pl-9 pr-4 py-2 text-sm font-body bg-surface-container rounded-xl text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
