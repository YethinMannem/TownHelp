'use client'

import { useState, useEffect } from 'react'

function formatRelativeTime(isoDate: string): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(isoDate).getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
}

export function RelativeTime({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState(() => formatRelativeTime(isoDate))

  useEffect(() => {
    setLabel(formatRelativeTime(isoDate))
    const id = setInterval(() => setLabel(formatRelativeTime(isoDate)), 60_000)
    return () => clearInterval(id)
  }, [isoDate])

  return <time dateTime={isoDate}>{label}</time>
}
