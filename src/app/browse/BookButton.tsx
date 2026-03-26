'use client'

import { useState } from 'react'
import { createBooking } from '@/app/actions/booking'
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
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Book {providerName}
      </button>
    )
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-2">
      <h4 className="font-medium text-gray-800 mb-3">Book {providerName}</h4>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service
            </label>
            <select
              name="categoryId"
              onChange={(e) => {
                const found = services.find((s) => s.category?.id === e.target.value)
                setSelectedService(found || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
          <label htmlFor={`address-${providerId}`} className="block text-sm font-medium text-gray-700 mb-1">
            Service Address
          </label>
          <input
            type="text"
            id={`address-${providerId}`}
            name="serviceAddress"
            placeholder="e.g. Flat 302, Cyber Heights, Madhapur"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor={`notes-${providerId}`} className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            id={`notes-${providerId}`}
            name="notes"
            placeholder="e.g. Need help with AC repair in bedroom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 text-sm"
          >
            {loading ? 'Booking...' : `Confirm Booking · ₹${selectedService?.customRate || baseRate}`}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
