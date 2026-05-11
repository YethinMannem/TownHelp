'use client'

import { useState, useTransition } from 'react'
import { toggleAvailability, updateAvailabilityHours, setWeeklyAvailability } from '@/app/actions/provider'
import { Button } from '@/components/ui/Button'
import { Wifi, WifiOff, Check, Copy } from 'lucide-react'

const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface SlotData {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

const PRESETS = [
  { label: 'Mon–Fri, 9–5', days: [1,2,3,4,5] as readonly number[],     start: '09:00', end: '17:00' },
  { label: 'Mon–Sat, 9–6', days: [1,2,3,4,5,6] as readonly number[],   start: '09:00', end: '18:00' },
  { label: 'All week, 9–5', days: [0,1,2,3,4,5,6] as readonly number[], start: '09:00', end: '17:00' },
  { label: 'Weekends',      days: [0,6] as readonly number[],            start: '10:00', end: '18:00' },
]

interface AvailabilityFormProps {
  isAvailable: boolean
  availableFrom: string
  availableTo: string
  weeklySlots: SlotData[]
}

export default function AvailabilityForm({
  isAvailable,
  availableFrom,
  availableTo,
  weeklySlots,
}: AvailabilityFormProps) {
  const [togglePending, startToggle] = useTransition()
  const [hoursPending, startHours] = useTransition()
  const [weeklyPending, startWeekly] = useTransition()
  const [slots, setSlots] = useState<SlotData[]>(weeklySlots)
  const [weeklySaved, setWeeklySaved] = useState(false)
  const [weeklyError, setWeeklyError] = useState('')
  const [hoursError, setHoursError] = useState('')
  const [hoursSaved, setHoursSaved] = useState(false)

  function handleToggle() {
    startToggle(async () => { await toggleAvailability() })
  }

  function handleHoursSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHoursError('')
    setHoursSaved(false)
    const form = event.currentTarget
    const from = (form.elements.namedItem('availableFrom') as HTMLInputElement).value
    const to = (form.elements.namedItem('availableTo') as HTMLInputElement).value
    if (from >= to) {
      setHoursError('Start time must be before end time.')
      return
    }
    startHours(async () => {
      try {
        await updateAvailabilityHours(from, to)
        setHoursSaved(true)
      } catch (error) {
        setHoursError(error instanceof Error ? error.message : 'Failed to save profile hours.')
      }
    })
  }

  function updateSlot(dayOfWeek: number, field: keyof SlotData, value: string | boolean) {
    setSlots((prev) => prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s)))
    setWeeklySaved(false)
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        isActive: preset.days.includes(s.dayOfWeek),
        startTime: preset.days.includes(s.dayOfWeek) ? preset.start : s.startTime,
        endTime: preset.days.includes(s.dayOfWeek) ? preset.end : s.endTime,
      }))
    )
    setWeeklySaved(false)
  }

  function copyTimesToAllActive(sourceDayOfWeek: number) {
    const source = slots.find((s) => s.dayOfWeek === sourceDayOfWeek)
    if (!source) return
    setSlots((prev) =>
      prev.map((s) => s.isActive ? { ...s, startTime: source.startTime, endTime: source.endTime } : s)
    )
    setWeeklySaved(false)
  }

  function handleWeeklySubmit() {
    setWeeklyError('')
    setWeeklySaved(false)
    for (const slot of slots) {
      if (slot.isActive && slot.startTime >= slot.endTime) {
        setWeeklyError(`${DAY_NAMES[slot.dayOfWeek]}: start must be before end.`)
        return
      }
    }
    startWeekly(async () => {
      const result = await setWeeklyAvailability(slots)
      if (result.success) setWeeklySaved(true)
      else setWeeklyError(result.error || 'Failed to save.')
    })
  }

  const activeDays = slots.filter((s) => s.isActive)

  return (
    <div className="space-y-3">
      {/* Status toggle — compact single line */}
      <div className="bg-surface-container rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAvailable
            ? <Wifi className="w-4 h-4 text-primary" />
            : <WifiOff className="w-4 h-4 text-on-surface-variant" />
          }
          <span className="font-body text-sm font-semibold text-on-surface">
            {isAvailable ? 'Online' : 'Offline'}
          </span>
          <span className="text-xs text-on-surface-variant font-body">
            &middot; {isAvailable ? 'Accepting bookings' : 'Hidden from customers'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={togglePending}
          aria-label={isAvailable ? 'Go offline' : 'Go online'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${
            isAvailable ? 'bg-primary' : 'bg-outline-variant'
          }`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-surface shadow transition-transform ${
            isAvailable ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Profile hours — compact */}
      <form onSubmit={handleHoursSubmit} className="bg-surface-container rounded-2xl px-5 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="availableFrom" className="block text-[11px] font-body font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Profile hours
            </label>
            <div className="flex items-center gap-2">
              <input
                id="availableFrom"
                name="availableFrom"
                type="time"
                defaultValue={availableFrom}
                required
                className="w-full px-3 py-2 text-sm font-body bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-xs text-on-surface-variant shrink-0">to</span>
              <input
                id="availableTo"
                name="availableTo"
                type="time"
                defaultValue={availableTo}
                required
                className="w-full px-3 py-2 text-sm font-body bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <Button type="submit" loading={hoursPending} disabled={hoursPending} size="sm" className="shrink-0">
            {hoursPending ? '...' : 'Save'}
          </Button>
        </div>
        {hoursError && (
          <p className="mt-2 text-xs font-body text-error">{hoursError}</p>
        )}
        {hoursSaved && !hoursError && (
          <p className="mt-2 flex items-center gap-1 text-xs font-body font-medium text-primary">
            <Check className="w-3.5 h-3.5" /> Saved
          </p>
        )}
      </form>

      {/* Weekly schedule — the main section */}
      <div className="bg-surface-container rounded-2xl px-5 py-5">
        <h2 className="font-headline text-base font-semibold text-on-surface">Booking Schedule</h2>
        <p className="font-body text-xs text-on-surface-variant mt-0.5">
          Tap days to toggle. Customers book within these hours.
        </p>

        {/* Day selector — horizontal strip */}
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {slots.map((slot) => (
            <button
              key={slot.dayOfWeek}
              type="button"
              onClick={() => updateSlot(slot.dayOfWeek, 'isActive', !slot.isActive)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                slot.isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant/50 hover:bg-surface-container-high'
              }`}
            >
              <span className="text-[10px] font-body font-medium opacity-70">
                {DAY_LABELS[slot.dayOfWeek]}
              </span>
              <span className="text-sm font-body font-bold">
                {DAY_SHORT[slot.dayOfWeek]}
              </span>
            </button>
          ))}
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-2.5 py-1 rounded-full text-[11px] font-body font-medium bg-surface-container-lowest border border-outline-variant/25 text-on-surface-variant hover:bg-primary-fixed/30 hover:text-on-surface hover:border-primary/20 active:scale-95 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Time rows — only for active days */}
        {activeDays.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {activeDays.map((slot) => (
              <div
                key={slot.dayOfWeek}
                className="flex items-center gap-2 rounded-xl bg-primary-fixed/10 border border-primary/10 px-3 py-2"
              >
                <span className="shrink-0 w-8 text-xs font-body font-bold text-primary">
                  {DAY_LABELS[slot.dayOfWeek]}
                </span>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'startTime', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-sm font-body bg-surface-container-lowest rounded-lg border border-outline-variant/20 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="text-[10px] text-on-surface-variant font-body">–</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'endTime', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-sm font-body bg-surface-container-lowest rounded-lg border border-outline-variant/20 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {activeDays.length > 1 && (
                  <button
                    type="button"
                    onClick={() => copyTimesToAllActive(slot.dayOfWeek)}
                    title="Apply to all active days"
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:text-primary hover:bg-primary-fixed/30 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeDays.length === 0 && (
          <p className="mt-4 text-center text-sm text-on-surface-variant/50 font-body py-3">
            No days selected. Tap days above or use a preset.
          </p>
        )}

        {weeklyError && (
          <div className="mt-3 p-2.5 bg-error-container rounded-xl text-on-error-container text-sm font-body">
            {weeklyError}
          </div>
        )}

        {weeklySaved && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-primary font-body font-medium">
            <Check className="w-4 h-4" /> Saved
          </div>
        )}

        <Button
          type="button"
          onClick={handleWeeklySubmit}
          loading={weeklyPending}
          disabled={weeklyPending}
          className="w-full mt-4"
          size="lg"
        >
          {weeklyPending ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  )
}
