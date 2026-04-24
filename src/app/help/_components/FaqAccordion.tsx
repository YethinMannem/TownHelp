'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface FaqItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I cancel a booking?',
    answer:
      'You can cancel for free up to 2 hours before the scheduled time. Open your booking, tap \u2018Cancel\u2019, and confirm. For cancellations within 2 hours, a fee may apply.',
  },
  {
    question: "What if the provider doesn't show up?",
    answer:
      "If your provider doesn't show up at the scheduled time, mark the booking as a dispute using \u2018Report Problem\u2019. Our team reviews disputes within 24 hours and will help arrange an alternative.",
  },
  {
    question: 'How are providers verified?',
    answer:
      "Every provider on TownHelp goes through a mandatory ID check (Aadhaar/PAN) before they can accept bookings. Providers with the \u2018ID Verified\u2019 badge have been manually reviewed by our team.",
  },
  {
    question: 'How does payment work?',
    answer:
      'Payment is made directly to the provider after the service is completed \u2014 cash is the most common method. You can also pay via UPI. Never pay in advance before the job is done.',
  },
  {
    question: "What if I'm unhappy with the service?",
    answer:
      "Tap \u2018Report Problem\u2019 in your booking within 24 hours of completion. Describe the issue and our team will review it and respond within 1 business day.",
  },
  {
    question: 'Can I book the same provider regularly?',
    answer:
      "Yes! After a completed booking, tap \u2018Book Again\u2019 on the provider's profile. For recurring bookings (daily, weekly), message your provider to set up a schedule.",
  },
  {
    question: 'Is my personal information safe?',
    answer:
      'Yes. Your phone number and address are never shared with providers until a booking is confirmed. Providers can only contact you via in-app chat.',
  },
]

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="divide-y divide-outline-variant/20">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index
        const headingId = `faq-heading-${index}`
        const panelId = `faq-panel-${index}`
        return (
          <div key={index}>
            <button
              type="button"
              id={headingId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-surface-container transition-colors"
            >
              <span className="text-sm font-body font-semibold text-on-surface">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              hidden={!isOpen}
              className="px-4 pb-4"
            >
              <p className="text-sm font-body text-on-surface-variant leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
