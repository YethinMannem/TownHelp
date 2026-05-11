'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, LocateFixed, Loader2, X } from 'lucide-react'

interface Suggestion {
  label: string
  sublabel: string
  raw: string
}

// Nominatim — used only for reverse geocoding (GPS → area name)
interface NominatimResult {
  display_name: string
  address: {
    suburb?: string
    neighbourhood?: string
    quarter?: string
    residential?: string
    city_district?: string
    village?: string
    town?: string
    city?: string
    state?: string
  }
}

function extractNominatimLabel(address: NominatimResult['address']): string {
  return (
    address.suburb ??
    address.neighbourhood ??
    address.quarter ??
    address.residential ??
    address.village ??
    address.town ??
    ''
  )
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('reverse geocode failed')
  const data = (await res.json()) as NominatimResult
  return extractNominatimLabel(data.address) || data.display_name.split(',')[0].trim()
}

// Photon (komoot) — used for autocomplete; supports prefix matching unlike Nominatim
interface PhotonFeature {
  properties: {
    name?: string
    district?: string
    city?: string
    state?: string
    country?: string
    type?: string
  }
}

interface PhotonResponse {
  features: PhotonFeature[]
}

// Hyderabad city centre — biases results toward Hyderabad
const HYD_LAT = 17.38
const HYD_LON = 78.48

async function searchLocations(query: string): Promise<Suggestion[]> {
  const q = encodeURIComponent(query)
  const url = `https://photon.komoot.io/api/?q=${q}&lat=${HYD_LAT}&lon=${HYD_LON}&limit=7&lang=en`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const data = (await res.json()) as PhotonResponse
  const seen = new Set<string>()
  const results: Suggestion[] = []
  for (const feature of data.features) {
    const { name, district, city, state, country } = feature.properties
    if (!name || country !== 'India') continue
    if (seen.has(name)) continue
    seen.add(name)
    const sublabelParts: string[] = []
    if (district && district !== name) sublabelParts.push(district)
    else if (city && city !== name) sublabelParts.push(city)
    if (state) sublabelParts.push(state)
    results.push({
      label: name,
      sublabel: sublabelParts.join(', '),
      raw: name,
    })
  }
  return results
}

interface LocationInputProps {
  name: string
  defaultValue: string
  placeholder?: string
  className?: string
}

export default function LocationInput({
  name,
  defaultValue,
  placeholder = 'e.g. Madhapur, Kondapur…',
  className = '',
}: LocationInputProps) {
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const didAutoDetect = useRef(false)

  // Auto-detect on mount if no value saved yet
  useEffect(() => {
    if (!defaultValue && !didAutoDetect.current) {
      didAutoDetect.current = true
      detect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const detect = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setDetectError('Location not supported on this device.')
      return
    }
    setDetecting(true)
    setDetectError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (label) {
            setValue(label)
            setSuggestions([])
            setOpen(false)
          } else {
            setDetectError('Could not determine your area. Please type it.')
          }
        } catch {
          setDetectError('Location lookup failed. Please type your area.')
        } finally {
          setDetecting(false)
        }
      },
      (err) => {
        setDetecting(false)
        if (err.code === err.PERMISSION_DENIED) {
          setDetectError('Location access denied. Please type your area.')
        } else {
          setDetectError('Could not get location. Please type your area.')
        }
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setValue(q)
    setDetectError(null)
    setActiveIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (q.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchLocations(q)
      setSuggestions(results)
      setOpen(results.length > 0)
    }, 300)
  }

  function handleSelect(s: Suggestion) {
    setValue(s.label)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input that carries the value to the form */}
      <input type="hidden" name={name} value={value} />

      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={detecting ? 'Detecting your location…' : placeholder}
          disabled={detecting}
          autoComplete="off"
          className={`w-full pl-9 pr-10 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-60 ${className}`}
        />

        {/* Right-side controls */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !detecting && (
            <button
              type="button"
              onClick={() => { setValue(''); setSuggestions([]); setOpen(false); inputRef.current?.focus() }}
              className="p-0.5 rounded-full text-on-surface-variant/50 hover:text-on-surface transition-colors"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={detect}
            disabled={detecting}
            className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
            aria-label="Detect my location"
            title="Use my current location"
          >
            {detecting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <LocateFixed className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.raw}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                i === activeIndex
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${i === activeIndex ? 'text-primary' : 'text-on-surface-variant/50'}`} />
              <div className="min-w-0">
                <p className="text-sm font-body font-medium truncate">{s.label}</p>
                {s.sublabel && (
                  <p className="text-xs font-body text-on-surface-variant truncate">{s.sublabel}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Error / hint */}
      {detectError && (
        <p className="mt-1 text-xs text-error font-body">{detectError}</p>
      )}
    </div>
  )
}
