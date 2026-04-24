'use client'

import { useRef, useState, useTransition } from 'react'
import { startBooking } from '@/app/actions/booking'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface StartWithOtpButtonProps {
  bookingId: string
}

export default function StartWithOtpButton({ bookingId }: StartWithOtpButtonProps) {
  const [otp, setOtp] = useState(['', '', '', ''])
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      setOtp(pasted.split(''))
      inputRefs.current[3]?.focus()
    }
    e.preventDefault()
  }

  function handleSubmit() {
    const code = otp.join('')
    startTransition(async () => {
      const result = await startBooking(bookingId, code)
      if (!result.success) {
        toast(result.error ?? 'Something went wrong.', 'error')
        setOtp(['', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    })
  }

  const isComplete = otp.every((d) => d !== '')

  return (
    <div className="space-y-3">
      <p className="text-xs text-on-surface-variant font-body">
        Ask the customer for the 4-digit job code shown on their app.
      </p>
      <div className="flex items-center gap-2">
        <div className="flex gap-2" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isPending}
              className="w-11 h-12 text-center text-lg font-bold font-body rounded-xl border-2 border-outline-variant bg-surface-container text-on-surface focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
              aria-label={`Job code digit ${i + 1}`}
            />
          ))}
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={!isComplete || isPending}
          onClick={handleSubmit}
        >
          {isPending ? 'Starting…' : 'Start Job'}
        </Button>
      </div>
    </div>
  )
}
