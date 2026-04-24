'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import LocationSearch, { type SelectedLocation } from './LocationSearch'

interface LocationCaptureProps {
  required?: boolean
  error?: string
  initialLat?: number | null
  initialLng?: number | null
  initialLabel?: string
  initialRadius?: number
}

export default function LocationCapture({
  required = false,
  error,
  initialLat = null,
  initialLng = null,
  initialLabel = '',
  initialRadius = 5,
}: LocationCaptureProps) {
  const [lat, setLat] = useState<number | null>(initialLat)
  const [lng, setLng] = useState<number | null>(initialLng)
  const [locationLabel, setLocationLabel] = useState(initialLabel)
  const [radiusKm, setRadiusKm] = useState(initialRadius)

  function handleSelect(loc: SelectedLocation): void {
    setLat(loc.lat)
    setLng(loc.lng)
    setLocationLabel(loc.label)
  }

  const hasLocation = lat !== null && lng !== null

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant font-body mb-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Your location
          {required && <span className="text-error" aria-hidden="true"> *</span>}
        </label>

        <LocationSearch
          placeholder="Search area or locality..."
          onSelect={handleSelect}
          initialValue={initialLabel}
        />

        {error && <p className="mt-1.5 text-xs text-error font-body">{error}</p>}
        {!hasLocation && !error && (
          <p className="mt-1.5 text-xs text-on-surface-variant/60 font-body">
            Customers nearby will see your profile
          </p>
        )}
      </div>

      {/* Radius slider — only after location confirmed */}
      {hasLocation && (
        <div className="space-y-1.5 px-1">
          <label htmlFor="radius-slider" className="text-xs font-medium text-on-surface-variant font-body">
            I travel up to{' '}
            <span className="text-on-surface font-semibold">{radiusKm} km</span>
          </label>
          <input
            id="radius-slider"
            type="range"
            min="1"
            max="20"
            step="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-on-surface-variant font-body">
            <span>1 km</span>
            <span>20 km</span>
          </div>
        </div>
      )}

      {/* Hidden form inputs */}
      {lat !== null && <input type="hidden" name="lat" value={lat} />}
      {lng !== null && <input type="hidden" name="lng" value={lng} />}
      <input type="hidden" name="locationLabel" value={locationLabel} />
      <input type="hidden" name="radiusKm" value={radiusKm} />
    </div>
  )
}
