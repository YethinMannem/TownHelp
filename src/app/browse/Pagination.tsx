'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  /** Current URL search params to preserve in pagination links */
  searchParams: Record<string, string | undefined>
}

export default function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null

  function buildHref(page: number): string {
    const params = new URLSearchParams()
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.search) params.set('search', searchParams.search)
    if (searchParams.area) params.set('area', searchParams.area)
    if (searchParams.sort) params.set('sort', searchParams.sort)
    if (searchParams.availableToday) params.set('availableToday', searchParams.availableToday)
    if (searchParams.lat) params.set('lat', searchParams.lat)
    if (searchParams.lng) params.set('lng', searchParams.lng)
    if (searchParams.nearMe) params.set('nearMe', '1')
    if (searchParams.locationLabel && searchParams.nearMe) params.set('locationLabel', searchParams.locationLabel)
    if (page > 1) params.set('page', String(page))
    return `/browse?${params.toString()}`
  }

  return (
    <nav className="flex items-center justify-center gap-2 py-6" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </Link>
      ) : (
        <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-outline/40">
          <ChevronLeft className="w-4.5 h-4.5" />
        </span>
      )}

      <span className="text-sm font-body text-on-surface-variant px-2">
        Page <span className="font-semibold text-on-surface">{currentPage}</span> of{' '}
        <span className="font-semibold text-on-surface">{totalPages}</span>
      </span>

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </Link>
      ) : (
        <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-outline/40">
          <ChevronRight className="w-4.5 h-4.5" />
        </span>
      )}
    </nav>
  )
}
