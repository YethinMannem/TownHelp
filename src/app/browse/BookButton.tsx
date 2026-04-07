'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBooking, getAvailableSlots, type TimeSlot } from '@/app/actions/booking'
import { Button } from '@/components/ui/Button'
import type { ProviderServiceItem } from '@/types'
import { X, Clock, CalendarDays, ChevronLeft, ChevronRight, MapPin, FileText, Loader2 } from 'lucide-react'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function getNext14Days(): Date[] {
  const days: Date[] = []
  const now = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    days.push(d)
  }
  return days
}

export default function BookButton({
  providerId,
  providerName,
  services,
  baseRate,
}: {
  providerId: string
  providerName: string
  services: ProviderServiceItem[]
  baseRate: number
}) {
  const [showSheet, setShowSheet] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<ProviderServiceItem | null>(services[0] || null)

  const [dates] = useState(getNext14Days)
  const [dateScrollStart, setDateScrollStart] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (showSheet) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showSheet])

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setSlots([])
      setSelectedSlot(null)
      return
    }

    let cancelled = false
    setSlotsLoading(true)
    setSelectedSlot(null)

    getAvailableSlots(providerId, selectedDate).then((result) => {
      if (cancelled) return
      setSlotsLoading(false)
      if (result.error) {
        setError(result.error)
        setSlots([])
      } else {
        setSlots(result.slots)
      }
    })

    return () => { cancelled = true }
  }, [selectedDate, providerId])

  const closeSheet = useCallback(() => {
    setShowSheet(false)
    setSelectedDate(null)
    setSelectedSlot(null)
    setError('')
  }, [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    try {
      await createBooking(formData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // Just the trigger button when sheet is closed
  if (!showSheet) {
    return (
      <Button
        onClick={() => setShowSheet(true)}
        variant="primary"
        size="sm"
        className="w-full"
      >
        Book {providerName}
      </Button>
    )
  }

  const visibleDates = dates.slice(dateScrollStart, dateScrollStart + 7)
  const canScrollLeft = dateScrollStart > 0
  const canScrollRight = dateScrollStart + 7 < dates.length
  const availableSlots = slots.filter((s) => s.available)
  const rate = selectedService?.customRate || baseRate

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={closeSheet}
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] flex flex-col bg-surface-container-lowest rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:max-w-lg lg:w-full">
        {/* Handle + header */}
        <div className="shrink-0 px-5 pt-3 pb-4 border-b border-outline-variant/15">
          <div className="w-10 h-1 rounded-full bg-outline-variant/30 mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                Book {providerName}
              </h3>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                Select a date and time slot
              </p>
            </div>
            <button
              type="button"
              onClick={closeSheet}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {error && (
            <div className="mb-4 p-3 bg-error-container rounded-2xl text-on-error-container text-sm font-body">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <input type="hidden" name="providerId" value={providerId} />
            <input type="hidden" name="quotedRate" value={rate} />
            {selectedDate && <input type="hidden" name="scheduledDate" value={selectedDate} />}
            {selectedSlot && (
              <>
                <input type="hidden" name="scheduledStart" value={selectedSlot.start} />
                <input type="hidden" name="scheduledEnd" value={selectedSlot.end} />
              </>
            )}

            {/* Service selection */}
            {services.length > 1 ? (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant font-body mb-2 uppercase tracking-wider">
                  Service
                </label>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => {
                    const isActive = selectedService?.category?.id === s.category?.id
                    return (
                      <button
                        key={s.category?.id}
                        type="button"
                        onClick={() => setSelectedService(s)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-body font-medium transition-all ${
                          isActive
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {s.category?.name}
                        <span className={`ml-1.5 text-xs ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                          ₹{s.customRate || baseRate}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <input type="hidden" name="categoryId" value={selectedService?.category?.id || ''} />
              </div>
            ) : (
              <input type="hidden" name="categoryId" value={services[0]?.category?.id || ''} />
            )}

            {/* Date picker */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant font-body mb-2 uppercase tracking-wider">
                <CalendarDays className="w-3.5 h-3.5" />
                Date
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDateScrollStart((s) => Math.max(0, s - 7))}
                  disabled={!canScrollLeft}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
                </button>

                <div className="flex-1 flex gap-1.5 justify-between">
                  {visibleDates.map((d) => {
                    const ds = formatDateStr(d)
                    const isSelected = selectedDate === ds
                    const isToday = formatDateStr(new Date()) === ds
                    return (
                      <button
                        key={ds}
                        type="button"
                        onClick={() => setSelectedDate(isSelected ? null : ds)}
                        className={`flex-1 flex flex-col items-center py-2 rounded-2xl text-center transition-all ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-md scale-105'
                            : isToday
                              ? 'bg-primary-fixed/40 text-on-surface hover:bg-primary-fixed/60'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                        }`}
                      >
                        <span className={`text-[10px] font-body font-medium ${isSelected ? 'opacity-80' : 'opacity-50'}`}>
                          {DAY_SHORT[d.getDay()]}
                        </span>
                        <span className="text-base font-body font-bold leading-tight mt-0.5">
                          {d.getDate()}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setDateScrollStart((s) => Math.min(dates.length - 7, s + 7))}
                  disabled={!canScrollRight}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant font-body mb-2 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Time
                  {!slotsLoading && availableSlots.length > 0 && (
                    <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-on-surface-variant/60">
                      {availableSlots.length} available
                    </span>
                  )}
                </label>

                {slotsLoading ? (
                  <div className="py-6 flex flex-col items-center gap-2 text-on-surface-variant">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-body">Checking availability...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-5 text-center rounded-2xl bg-surface-container/60">
                    <p className="text-sm text-on-surface-variant font-body">
                      Not available on this day
                    </p>
                    <p className="text-xs text-on-surface-variant/60 font-body mt-1">
                      Try selecting a different date
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.start === slot.start
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(isSelected ? null : slot)}
                          className={`relative py-2.5 px-2 rounded-xl text-center transition-all ${
                            !slot.available
                              ? 'bg-surface-container/40 text-on-surface-variant/30 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary text-on-primary shadow-md ring-2 ring-primary/30 ring-offset-1 ring-offset-surface-container-lowest'
                                : 'bg-surface-container text-on-surface hover:bg-surface-container-high hover:shadow-sm'
                          }`}
                        >
                          <span className="text-sm font-body font-semibold">
                            {formatTime12(slot.start).replace(' ', '')}
                          </span>
                          {!slot.available && (
                            <span className="block text-[9px] font-body opacity-60 mt-0.5">Booked</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Address & Notes — only show after slot is picked */}
            {selectedSlot && (
              <>
                <div>
                  <label htmlFor={`address-${providerId}`} className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant font-body mb-2 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    Service Address
                  </label>
                  <input
                    type="text"
                    id={`address-${providerId}`}
                    name="serviceAddress"
                    placeholder="e.g. Flat 302, Cyber Heights, Madhapur"
                    className="w-full px-4 py-3 text-sm font-body bg-surface-container rounded-2xl text-on-surface placeholder-on-surface-variant/50 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label htmlFor={`notes-${providerId}`} className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant font-body mb-2 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5" />
                    Notes
                    <span className="font-normal normal-case tracking-normal opacity-50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id={`notes-${providerId}`}
                    name="notes"
                    placeholder="e.g. Need help with AC repair in bedroom"
                    className="w-full px-4 py-3 text-sm font-body bg-surface-container rounded-2xl text-on-surface placeholder-on-surface-variant/50 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </>
            )}

            {/* Spacer for bottom bar */}
            {selectedSlot && <div className="h-4" />}
          </form>
        </div>

        {/* Fixed bottom confirmation bar */}
        {selectedSlot && selectedDate && (
          <div className="shrink-0 border-t border-outline-variant/15 px-5 py-4 bg-surface-container-lowest safe-bottom">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-on-surface-variant font-body">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })}
                  {' '}&middot;{' '}
                  {formatTime12(selectedSlot.start)} – {formatTime12(selectedSlot.end)}
                </p>
              </div>
              <p className="text-lg font-headline font-bold text-primary shrink-0">
                ₹{rate}
              </p>
            </div>
            <Button
              type="submit"
              form={undefined}
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                const form = document.querySelector(`form [name="providerId"][value="${providerId}"]`)?.closest('form')
                if (form) {
                  form.requestSubmit()
                }
              }}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
