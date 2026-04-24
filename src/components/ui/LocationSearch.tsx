'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, LocateFixed, Loader2, X, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'

interface NominatimAddress {
  house_number?: string
  road?: string
  pedestrian?: string
  footway?: string
  amenity?: string
  shop?: string
  building?: string
  suburb?: string
  city_district?: string
  neighbourhood?: string
  quarter?: string
  city?: string
  town?: string
  village?: string
  state_district?: string
  state?: string
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address: NominatimAddress
}

export interface SelectedLocation {
  lat: number
  lng: number
  label: string
}

interface SavedLocation {
  label: string
  lat: number
  lng: number
}

const RECENTS_KEY = 'th_recent_locs'
const MAX_RECENTS = 5

function loadRecents(): SavedLocation[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    return raw ? (JSON.parse(raw) as SavedLocation[]) : []
  } catch {
    return []
  }
}

function saveRecent(loc: SavedLocation): void {
  try {
    const existing = loadRecents().filter((r) => r.label !== loc.label)
    localStorage.setItem(RECENTS_KEY, JSON.stringify([loc, ...existing].slice(0, MAX_RECENTS)))
  } catch {}
}

function buildMainLabel(result: NominatimResult): string {
  const addr = result.address

  // Named place (shop, amenity, building) — use its name as headline
  const placeName = addr.amenity ?? addr.shop ?? addr.building ?? ''
  if (placeName) {
    const road = addr.road ?? addr.pedestrian ?? addr.footway ?? ''
    return road ? `${placeName}, ${road}` : placeName
  }

  // Street-level: house number + road
  const road = addr.road ?? addr.pedestrian ?? addr.footway ?? ''
  if (road) {
    return addr.house_number ? `${addr.house_number}, ${road}` : road
  }

  // Area / locality fallback
  return result.display_name.split(',')[0].trim()
}

function buildSubLabel(main: string, addr: NominatimAddress): string {
  const area = addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? addr.city_district ?? ''
  const city = addr.city ?? addr.town ?? addr.village ?? addr.state_district ?? ''
  const parts = [area !== main ? area : '', city !== main ? city : ''].filter(Boolean)
  return [...new Set(parts)].join(', ')
}

interface LocationSearchProps {
  placeholder?: string
  onSelect: (loc: SelectedLocation) => void
  initialValue?: string
  className?: string
}

export default function LocationSearch({
  placeholder = 'Search area or locality...',
  onSelect,
  initialValue = '',
  className,
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [recents, setRecents] = useState<SavedLocation[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)  // -1=none, 0=GPS, 1+=list items
  const [geoError, setGeoError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(!!initialValue)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setRecents(loadRecents())
  }, [])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function handleSelect(loc: SelectedLocation): void {
    saveRecent({ label: loc.label, lat: loc.lat, lng: loc.lng })
    setRecents(loadRecents())
    setQuery(loc.label)
    setConfirmed(true)
    setOpen(false)
    setActiveIndex(-1)
    setResults([])
    setGeoError(null)
    onSelect(loc)
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value
    setQuery(value)
    setConfirmed(false)
    setActiveIndex(-1)
    setGeoError(null)

    if (!value.trim()) {
      setResults([])
      setOpen(true)  // show GPS + recents
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    setOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) return

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=6&countrycodes=in&addressdetails=1`,
          { headers: { 'User-Agent': 'TownHelp/1.0' } }
        )
        if (res.ok) {
          const data = await res.json() as NominatimResult[]
          setResults(data)
        }
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 250)
  }

  // Build the flat list of selectable items for keyboard nav:
  // index 0 = GPS, index 1..n = recents (when !query) or results (when query)
  type ListItem =
    | { type: 'gps' }
    | { type: 'recent'; loc: SavedLocation }
    | { type: 'result'; result: NominatimResult }

  function getItems(): ListItem[] {
    const items: ListItem[] = [{ type: 'gps' }]
    if (!query.trim()) {
      recents.forEach((loc) => items.push({ type: 'recent', loc }))
    } else {
      results.forEach((result) => items.push({ type: 'result', result }))
    }
    return items
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): Promise<void> {
    const items = getItems()

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) { setOpen(true); return }
      setActiveIndex((prev) => Math.min(prev + 1, items.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      // Active item from keyboard nav
      if (activeIndex >= 0 && activeIndex < items.length) {
        const item = items[activeIndex]
        if (item.type === 'gps') {
          handleGps()
        } else if (item.type === 'recent') {
          handleSelect(item.loc)
        } else {
          const main = buildMainLabel(item.result)
          handleSelect({ lat: parseFloat(item.result.lat), lng: parseFloat(item.result.lon), label: main })
        }
        return
      }

      // No active — use top result if loaded
      if (results.length > 0) {
        const main = buildMainLabel(results[0])
        handleSelect({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), label: main })
        return
      }

      // Nothing loaded yet — geocode immediately
      const value = query.trim()
      if (!value) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1&countrycodes=in&addressdetails=1`,
          { headers: { 'User-Agent': 'TownHelp/1.0' } }
        )
        if (res.ok) {
          const data = await res.json() as NominatimResult[]
          if (data.length > 0) {
            const main = buildMainLabel(data[0])
            handleSelect({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: main })
          } else {
            setGeoError('No location found. Try a different name.')
          }
        }
      } catch {
        setGeoError('Could not search. Check your connection.')
      } finally {
        setSearching(false)
      }
    }
  }

  function handleGps(): void {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser.')
      return
    }
    setLocating(true)
    setOpen(false)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'User-Agent': 'TownHelp/1.0' } }
          )
          if (res.ok) {
            const data = await res.json() as NominatimResult
            const main = buildMainLabel(data)
            handleSelect({ lat: latitude, lng: longitude, label: main })
          } else {
            handleSelect({ lat: latitude, lng: longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` })
          }
        } catch {
          handleSelect({ lat: latitude, lng: longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` })
        }
        setLocating(false)
      },
      () => {
        setLocating(false)
        setGeoError('Could not get your location. Please allow location access.')
      },
      { timeout: 10000 }
    )
  }

  function handleClear(): void {
    setQuery('')
    setConfirmed(false)
    setResults([])
    setGeoError(null)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const items = getItems()
  const showDropdown = open && !locating
  const listItems = !query.trim() ? recents : results

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input box */}
      <div className={cn(
        'flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border bg-surface-container-lowest transition-all',
        confirmed ? 'border-primary/40 shadow-sm' : open ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/30',
      )}>
        {locating ? (
          <Loader2 className="w-4.5 h-4.5 text-primary animate-spin shrink-0" />
        ) : confirmed ? (
          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
        ) : (
          <MapPin className="w-4.5 h-4.5 text-outline shrink-0" />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-activedescendant={activeIndex >= 0 ? `loc-item-${activeIndex}` : undefined}
          className="flex-1 min-w-0 text-sm font-body bg-transparent text-on-surface placeholder-on-surface-variant/50 focus:outline-none"
        />

        {searching && !locating && (
          <Loader2 className="w-3.5 h-3.5 text-outline animate-spin shrink-0" />
        )}

        {(query || confirmed) && !locating && (
          <button
            type="button"
            onClick={handleClear}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-outline-variant/30 transition-colors shrink-0"
            aria-label="Clear location"
          >
            <X className="w-3 h-3 text-on-surface-variant" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-50 mt-1.5 w-full max-h-72 overflow-y-auto bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* GPS — always index 0 */}
          <li
            id="loc-item-0"
            role="option"
            aria-selected={activeIndex === 0}
          >
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleGps() }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                listItems.length > 0 && 'border-b border-outline-variant/10',
                activeIndex === 0 ? 'bg-primary/8' : 'hover:bg-primary/5',
              )}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <LocateFixed className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold font-body text-primary leading-tight">Use current location</p>
                <p className="text-xs font-body text-on-surface-variant mt-0.5">Detect via GPS</p>
              </div>
            </button>
          </li>

          {/* Recent searches — shown when input is empty */}
          {!query.trim() && recents.map((loc, i) => (
            <li
              key={loc.label}
              id={`loc-item-${i + 1}`}
              role="option"
              aria-selected={activeIndex === i + 1}
            >
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(loc) }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  activeIndex === i + 1 ? 'bg-surface-container' : 'hover:bg-surface-container',
                )}
              >
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium font-body text-on-surface truncate">{loc.label}</p>
                  <p className="text-xs font-body text-on-surface-variant mt-0.5">Recent</p>
                </div>
              </button>
            </li>
          ))}

          {/* Search results — shown when typing */}
          {query.trim().length >= 2 && results.map((result, i) => {
            const main = buildMainLabel(result)
            const sub = buildSubLabel(main, result.address)
            const itemIndex = i + 1
            return (
              <li
                key={`${result.lat}-${result.lon}`}
                id={`loc-item-${itemIndex}`}
                role="option"
                aria-selected={activeIndex === itemIndex}
              >
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), label: main }) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    activeIndex === itemIndex ? 'bg-surface-container' : 'hover:bg-surface-container',
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold font-body text-on-surface truncate">{main}</p>
                    {sub && <p className="text-xs font-body text-on-surface-variant truncate mt-0.5">{sub}</p>}
                  </div>
                </button>
              </li>
            )
          })}

          {/* Empty state */}
          {query.trim().length >= 2 && results.length === 0 && !searching && (
            <li className="px-4 py-4 text-sm text-on-surface-variant font-body text-center">
              No locations found for &ldquo;{query}&rdquo;
            </li>
          )}

          {/* Loading skeleton */}
          {searching && (
            <>
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-surface-container animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-surface-container rounded animate-pulse w-2/3" />
                    <div className="h-2.5 bg-surface-container rounded animate-pulse w-1/2" />
                  </div>
                </li>
              ))}
            </>
          )}
        </ul>
      )}

      {geoError && (
        <p className="mt-1.5 text-xs text-error font-body">{geoError}</p>
      )}
    </div>
  )
}
