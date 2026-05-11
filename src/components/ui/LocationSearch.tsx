'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, LocateFixed, Loader2, X, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'

// Photon (Komoot) — prefix-based autocomplete, used for forward search
interface PhotonFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] } // [lon, lat]
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    street?: string
    housenumber?: string
    postcode?: string
    district?: string
    locality?: string
    county?: string
    osm_key?: string
    osm_value?: string
    osm_type?: string
    osm_id?: number
  }
}

// Nominatim — used only for GPS reverse geocoding
interface NominatimReverseResult {
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    pedestrian?: string
    footway?: string
    amenity?: string
    leisure?: string
    tourism?: string
    shop?: string
    building?: string
    suburb?: string
    neighbourhood?: string
    city_district?: string
    city?: string
    town?: string
    village?: string
    state_district?: string
    state?: string
  }
}

export interface SelectedLocation {
  lat: number
  lng: number
  label: string
  city?: string
  state?: string
}

interface SavedLocation {
  label: string
  lat: number
  lng: number
}

// Greater Hyderabad center — biases Photon results toward the city
const HYD_LAT = 17.44
const HYD_LON = 78.38

// Bounding box for Greater Hyderabad — filters Photon results to the city region
const HYD_BBOX = '78.18,17.18,78.72,17.66'

const RECENTS_KEY = 'th_recent_locs'
const MAX_RECENTS = 5

// Popular Hyderabad localities shown when the field is empty
const POPULAR_AREAS: SelectedLocation[] = [
  { label: 'HITECH City',    lat: 17.4474, lng: 78.3762, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Kondapur',       lat: 17.4610, lng: 78.3591, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Gachibowli',     lat: 17.4401, lng: 78.3489, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Madhapur',       lat: 17.4484, lng: 78.3915, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Banjara Hills',  lat: 17.4138, lng: 78.4498, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Jubilee Hills',  lat: 17.4317, lng: 78.4093, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Kukatpally',     lat: 17.4849, lng: 78.3992, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Miyapur',        lat: 17.4967, lng: 78.3569, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Ameerpet',       lat: 17.4375, lng: 78.4483, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Secunderabad',   lat: 17.4399, lng: 78.4983, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Manikonda',      lat: 17.4046, lng: 78.3888, city: 'Hyderabad', state: 'Telangana' },
  { label: 'Dilsukhnagar',   lat: 17.3686, lng: 78.5257, city: 'Hyderabad', state: 'Telangana' },
]

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

function photonLabel(f: PhotonFeature): { main: string; sub: string; city: string; state: string } {
  const p = f.properties

  const main = p.name ?? p.street ?? p.district ?? p.locality ?? p.city ?? ''

  // Build sub-label: street → district/locality → city (skip anything that's already in main)
  const parts: string[] = []
  if (p.street && p.street !== main) parts.push(p.street)
  const area = p.district ?? p.locality ?? p.county ?? ''
  if (area && area !== main && area !== p.street) parts.push(area)
  const city = p.city ?? ''
  if (city && city !== main) parts.push(city)
  const sub = [...new Set(parts)].join(', ')

  return { main, sub, city: p.city ?? '', state: p.state ?? '' }
}

interface LocationSearchProps {
  placeholder?: string
  onSelect: (loc: SelectedLocation) => void
  onClear?: () => void
  onInputChange?: (value: string) => void
  initialValue?: string
  className?: string
}

export default function LocationSearch({
  placeholder = 'Search area or locality...',
  onSelect,
  onClear,
  onInputChange,
  initialValue = '',
  className,
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<PhotonFeature[]>([])
  const [recents, setRecents] = useState<SavedLocation[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(!!initialValue)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Sync display when parent updates initialValue (e.g. after router.push)
  useEffect(() => {
    setQuery(initialValue)
    setConfirmed(!!initialValue)
  }, [initialValue])

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

  function selectPhotonFeature(f: PhotonFeature): void {
    const [lon, lat] = f.geometry.coordinates
    const { main, city, state } = photonLabel(f)
    if (!main) return
    handleSelect({ lat, lng: lon, label: main, city, state })
  }

  async function searchPhoton(value: string): Promise<void> {
    setSearching(true)
    try {
      const url =
        `https://photon.komoot.io/api/` +
        `?q=${encodeURIComponent(value)}` +
        `&lat=${HYD_LAT}&lon=${HYD_LON}` +
        `&bbox=${HYD_BBOX}` +
        `&limit=8&lang=en`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json() as { features: PhotonFeature[] }
        setResults(data.features ?? [])
      }
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value
    setQuery(value)
    setConfirmed(false)
    onInputChange?.(value)
    setActiveIndex(-1)
    setGeoError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setResults([])
      setOpen(true)
      return
    }

    setOpen(true)
    if (value.trim().length < 2) return

    // 150ms debounce — feels instant like Rapido/Uber
    debounceRef.current = setTimeout(() => { void searchPhoton(value) }, 150)
  }

  type ListItem =
    | { type: 'gps' }
    | { type: 'recent'; loc: SavedLocation }
    | { type: 'popular'; loc: SelectedLocation }
    | { type: 'result'; feature: PhotonFeature }

  function getItems(): ListItem[] {
    const items: ListItem[] = [{ type: 'gps' }]
    if (!query.trim()) {
      recents.forEach((loc) => items.push({ type: 'recent', loc }))
      // Show popular areas only when there are no recent searches
      if (recents.length === 0) {
        POPULAR_AREAS.forEach((loc) => items.push({ type: 'popular', loc }))
      }
    } else {
      results.forEach((feature) => items.push({ type: 'result', feature }))
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

      if (activeIndex >= 0 && activeIndex < items.length) {
        const item = items[activeIndex]
        if (item.type === 'gps') {
          handleGps()
        } else if (item.type === 'recent') {
          handleSelect(item.loc)
        } else if (item.type === 'popular') {
          handleSelect(item.loc)
        } else {
          selectPhotonFeature(item.feature)
        }
        return
      }

      if (results.length > 0) {
        selectPhotonFeature(results[0])
        return
      }

      const value = query.trim()
      if (!value) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      await searchPhoton(value)
      // After search resolves, top result auto-selects on next Enter press
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
            { headers: { 'User-Agent': 'TownHelp/1.0 (townhelp.in)', 'Accept-Language': 'en' } }
          )
          if (res.ok) {
            const data = await res.json() as NominatimReverseResult
            const addr = data.address
            const label =
              addr.amenity ?? addr.leisure ?? addr.tourism ?? addr.shop ??
              addr.road ?? addr.pedestrian ?? addr.footway ??
              addr.suburb ?? addr.neighbourhood ??
              data.display_name.split(',')[0].trim()
            const city = addr.city ?? addr.town ?? addr.village ?? addr.state_district ?? ''
            const state = addr.state ?? ''
            handleSelect({ lat: latitude, lng: longitude, label, city, state })
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
    onClear?.()
  }

  const showDropdown = open && !locating
  const items = getItems()
  const showRecents = !query.trim() && recents.length > 0
  const showPopular = !query.trim() && recents.length === 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className={cn(
        'flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border bg-surface-container-lowest transition-all',
        confirmed
          ? 'border-primary/40 shadow-sm'
          : open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-outline-variant/30',
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

      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-50 mt-1.5 w-full max-h-72 overflow-y-auto bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* GPS button — always first */}
          <li id="loc-item-0" role="option" aria-selected={activeIndex === 0}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleGps() }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                items.length > 1 && 'border-b border-outline-variant/10',
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

          {/* Section header for recent or popular */}
          {(showRecents || showPopular) && (
            <li className="px-4 pt-2.5 pb-1">
              <p className="text-[10px] font-bold font-body text-on-surface-variant uppercase tracking-wider">
                {showRecents ? 'Recent' : 'Popular in Hyderabad'}
              </p>
            </li>
          )}

          {/* Recent searches */}
          {showRecents && recents.map((loc, i) => {
            const idx = i + 1
            return (
              <li key={loc.label} id={`loc-item-${idx}`} role="option" aria-selected={activeIndex === idx}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(loc) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    activeIndex === idx ? 'bg-surface-container' : 'hover:bg-surface-container',
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
            )
          })}

          {/* Popular areas */}
          {showPopular && POPULAR_AREAS.map((loc, i) => {
            const idx = i + 1
            return (
              <li key={loc.label} id={`loc-item-${idx}`} role="option" aria-selected={activeIndex === idx}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(loc) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    activeIndex === idx ? 'bg-surface-container' : 'hover:bg-surface-container',
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium font-body text-on-surface truncate">{loc.label}</p>
                    <p className="text-xs font-body text-on-surface-variant mt-0.5">Hyderabad, Telangana</p>
                  </div>
                </button>
              </li>
            )
          })}

          {/* Photon autocomplete results */}
          {query.trim().length >= 2 && results.map((feature, i) => {
            const { main, sub } = photonLabel(feature)
            if (!main) return null
            const itemIndex = i + 1
            return (
              <li
                key={`${feature.properties.osm_type}-${feature.properties.osm_id}`}
                id={`loc-item-${itemIndex}`}
                role="option"
                aria-selected={activeIndex === itemIndex}
              >
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectPhotonFeature(feature) }}
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
