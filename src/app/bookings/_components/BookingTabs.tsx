'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface BookingTabsProps {
  requesterCount: number
  providerCount: number
  requesterContent: React.ReactNode
  providerContent: React.ReactNode
}

export default function BookingTabs({
  requesterCount,
  providerCount,
  requesterContent,
  providerContent,
}: BookingTabsProps) {
  const [activeTab, setActiveTab] = useState<'booked' | 'received'>(
    requesterCount > 0 ? 'booked' : 'received'
  )

  return (
    <div>
      {/* Tab bar */}
      <div className="flex bg-surface-container rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('booked')}
          className={cn(
            'flex-1 min-w-0 py-2 px-3 rounded-lg text-sm font-semibold font-body transition-all duration-150',
            activeTab === 'booked'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          Booked
          {requesterCount > 0 && (
            <span className="ml-1.5 text-xs font-normal whitespace-nowrap">({requesterCount})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={cn(
            'flex-1 min-w-0 py-2 px-3 rounded-lg text-sm font-semibold font-body transition-all duration-150',
            activeTab === 'received'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          Received
          {providerCount > 0 && (
            <span className="ml-1.5 text-xs font-normal whitespace-nowrap">({providerCount})</span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'booked' ? requesterContent : providerContent}
      </div>
    </div>
  )
}
