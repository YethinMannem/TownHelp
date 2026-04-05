'use client'

import { useState } from 'react'
import { createBooking } from '@/app/actions/booking'
import { Button } from '@/components/ui/Button'
import type { ProviderServiceItem } from '@/types'

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
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<ProviderServiceItem | null>(services[0] || null)

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

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        variant="primary"
        size="sm"
        className="w-full"
      >
        Book {providerName}
      </Button>
    )
  }

  return (
    <div className="border-t border-outline-variant/20 pt-4 mt-2">
      <h4 className="font-semibold text-on-surface font-body text-sm mb-3">
        Book {providerName}
      </h4>

      {error && (
        <div className="mb-3 p-3 bg-error-container rounded-xl text-on-error-container text-sm font-body">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="providerId" value={providerId} />
        <input
          type="hidden"
          name="quotedRate"
          value={selectedService?.customRate || baseRate}
        />

        {services.length > 1 ? (
          <div>
            <label className="block text-xs font-medium text-on-surface-variant font-body mb-1.5">
              Service
            </label>
            <select
              name="categoryId"
              onChange={(e) => {
                const found = services.find((s) => s.category?.id === e.target.value)
                setSelectedService(found || null)
              }}
              className="w-full px-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {services.map((s) => (
                <option key={s.category?.id} value={s.category?.id}>
                  {s.category?.name} — ₹{s.customRate || baseRate}/{s.rateType?.toLowerCase() || 'hr'}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="categoryId" value={services[0]?.category?.id || ''} />
        )}

        <div>
          <label htmlFor={`address-${providerId}`} className="block text-xs font-medium text-on-surface-variant font-body mb-1.5">
            Service Address
          </label>
          <input
            type="text"
            id={`address-${providerId}`}
            name="serviceAddress"
            placeholder="e.g. Flat 302, Cyber Heights, Madhapur"
            className="w-full px-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor={`notes-${providerId}`} className="block text-xs font-medium text-on-surface-variant font-body mb-1.5">
            Notes (optional)
          </label>
          <input
            type="text"
            id={`notes-${providerId}`}
            name="notes"
            placeholder="e.g. Need help with AC repair in bedroom"
            className="w-full px-3.5 py-2.5 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            {loading ? 'Booking...' : `Confirm · ₹${selectedService?.customRate || baseRate}`}
          </Button>
          <Button
            type="button"
            onClick={() => setShowForm(false)}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
