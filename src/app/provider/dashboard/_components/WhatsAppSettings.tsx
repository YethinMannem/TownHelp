'use client'

import { useTransition, useState } from 'react'
import { toggleWhatsappOptIn, updateWhatsappNumber } from '@/app/actions/provider'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { MessageCircle } from 'lucide-react'

interface WhatsAppSettingsProps {
  whatsappOptIn: boolean
  whatsappNumber: string | null
}

export default function WhatsAppSettings({
  whatsappOptIn,
  whatsappNumber,
}: WhatsAppSettingsProps) {
  const [optIn, setOptIn] = useState(whatsappOptIn)
  const [isPendingToggle, startToggle] = useTransition()
  const [isPendingNumber, startNumber] = useTransition()
  const [numberError, setNumberError] = useState<string | null>(null)
  const { toast } = useToast()

  // Display the stored number without the +91 prefix for the input
  const displayNumber = whatsappNumber?.replace(/^\+91/, '') ?? ''

  function handleToggle(): void {
    const next = !optIn
    startToggle(async () => {
      const result = await toggleWhatsappOptIn(next)
      if (result.success) {
        setOptIn(next)
        toast(next ? 'WhatsApp contact enabled.' : 'WhatsApp contact disabled.', 'success')
      } else {
        toast(result.error ?? 'Something went wrong.', 'error')
      }
    })
  }

  function handleNumberSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setNumberError(null)
    const formData = new FormData(e.currentTarget)
    startNumber(async () => {
      const result = await updateWhatsappNumber(formData)
      if (result.success) {
        toast('WhatsApp number saved.', 'success')
      } else {
        setNumberError(result.error ?? 'Something went wrong.')
        toast(result.error ?? 'Something went wrong.', 'error')
      }
    })
  }

  return (
    <div className="flex items-start gap-3 w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-4 py-4">
      <div className="w-9 h-9 rounded-lg bg-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5">
        <MessageCircle className="w-4 h-4 text-[#16a34a]" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Toggle row */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-body font-medium text-on-surface text-sm">WhatsApp Contact</p>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              {optIn
                ? 'Customers can message you on WhatsApp.'
                : 'Enable so customers can reach you directly.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={optIn}
            disabled={isPendingToggle}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${
              optIn ? 'bg-primary' : 'bg-outline/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                optIn ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Number input — shown when opted in */}
        {optIn && (
          <form onSubmit={handleNumberSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm font-body text-on-surface-variant">+91</span>
              <input
                name="whatsappNumber"
                type="tel"
                inputMode="numeric"
                defaultValue={displayNumber}
                placeholder="98765 43210"
                maxLength={10}
                className="flex-1 px-3 py-2 text-sm font-body bg-surface-container rounded-xl text-on-surface placeholder-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              <Button type="submit" size="sm" loading={isPendingNumber}>
                Save
              </Button>
            </div>
            {numberError && (
              <p className="text-xs text-error font-body">{numberError}</p>
            )}
            <p className="text-xs text-on-surface-variant font-body">
              Your number is only shared when a customer taps the WhatsApp button.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
