'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface BookingTabsProps {
  requesterCount: number
  providerCount: number
  requesterContent: React.ReactNode
  providerContent: React.ReactNode
  requesterPastContent?: React.ReactNode
  providerPastContent?: React.ReactNode
  requesterPastCount?: number
  providerPastCount?: number
  providerPendingCount?: number
}

export default function BookingTabs({
  requesterCount,
  providerCount,
  requesterContent,
  providerContent,
  requesterPastContent,
  providerPastContent,
  requesterPastCount = 0,
  providerPastCount = 0,
  providerPendingCount = 0,
}: BookingTabsProps) {
  const [activeTab, setActiveTab] = useState<'booked' | 'received'>(
    providerPendingCount > 0
      ? 'received'
      : requesterCount > 0 || requesterPastCount > 0
        ? 'booked'
        : 'received'
  )

  const pastContent = activeTab === 'booked' ? requesterPastContent : providerPastContent
  const pastCount = activeTab === 'booked' ? requesterPastCount : providerPastCount

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
          My Bookings
          {(requesterCount > 0 || requesterPastCount > 0) && (
            <span className="ml-1.5 text-xs font-normal whitespace-nowrap">({requesterCount + requesterPastCount})</span>
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
          <span className="inline-flex items-center justify-center gap-1.5">
            My Work
            {(providerCount > 0 || providerPastCount > 0) && (
              <span className="text-xs font-normal whitespace-nowrap">({providerCount + providerPastCount})</span>
            )}
            {providerPendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold leading-none">
                {providerPendingCount}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Active bookings */}
      <div className="mt-4">
        {activeTab === 'booked' ? requesterContent : providerContent}
      </div>

      {/* Past bookings */}
      {pastContent && pastCount > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-on-surface-variant font-body mb-3">
            Past ({pastCount})
          </h2>
          {pastContent}
        </div>
      )}
    </div>
  )
}
