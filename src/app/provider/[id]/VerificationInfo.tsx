'use client'

import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'

interface VerificationInfoProps {
  isVerified: boolean
  isBackgroundChecked: boolean
}

type OpenPanel = 'id' | 'background' | null

export default function VerificationInfo({
  isVerified,
  isBackgroundChecked,
}: VerificationInfoProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)

  function toggle(panel: OpenPanel) {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  if (!isVerified && !isBackgroundChecked) return null

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {isVerified && (
          <button
            type="button"
            onClick={() => toggle('id')}
            aria-expanded={openPanel === 'id'}
            aria-controls="verification-panel-id"
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-body font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            ID Verified
          </button>
        )}
        {isBackgroundChecked && (
          <button
            type="button"
            onClick={() => toggle('background')}
            aria-expanded={openPanel === 'background'}
            aria-controls="verification-panel-background"
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-body font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            Background Checked
          </button>
        )}
      </div>

      {openPanel === 'id' && (
        <div
          id="verification-panel-id"
          role="region"
          aria-label="ID verification details"
          className="mt-2 p-3 bg-primary-fixed/30 rounded-xl border border-primary/20"
        >
          <p className="text-xs font-semibold text-on-surface font-body mb-1">
            What does &quot;ID Verified&quot; mean?
          </p>
          <p className="text-xs text-on-surface-variant font-body leading-relaxed">
            Every provider on TownHelp submits a government-issued ID (Aadhaar or PAN) before
            they can receive bookings. Our team manually reviews each ID to confirm the
            provider&apos;s identity.
          </p>
          <button
            type="button"
            onClick={() => setOpenPanel(null)}
            className="mt-2 text-xs text-primary font-semibold font-body"
          >
            Got it
          </button>
        </div>
      )}

      {openPanel === 'background' && (
        <div
          id="verification-panel-background"
          role="region"
          aria-label="Background check details"
          className="mt-2 p-3 bg-primary-fixed/30 rounded-xl border border-primary/20"
        >
          <p className="text-xs font-semibold text-on-surface font-body mb-1">
            What does &quot;Background Checked&quot; mean?
          </p>
          <p className="text-xs text-on-surface-variant font-body leading-relaxed">
            This provider has submitted a police verification certificate. Our team has reviewed
            it and confirmed the provider has no reported criminal history.
          </p>
          <button
            type="button"
            onClick={() => setOpenPanel(null)}
            className="mt-2 text-xs text-primary font-semibold font-body"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
