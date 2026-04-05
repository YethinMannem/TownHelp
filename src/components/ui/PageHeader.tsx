import type { HTMLAttributes } from 'react'
import Link from 'next/link'
import { MapPin, Bell } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title?: string
  showLocation?: boolean
  locationLabel?: string
  showNotifications?: boolean
  unreadNotificationsCount?: number
}

export function PageHeader({
  title,
  showLocation = false,
  locationLabel = 'Your area',
  showNotifications = true,
  unreadNotificationsCount = 0,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showLocation && (
          <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
        )}
        <span className="font-headline font-bold text-base text-on-surface truncate max-w-full">
          {showLocation ? locationLabel : title}
        </span>
      </div>

      {showNotifications && (
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors relative"
        >
          <Bell className="w-5 h-5 text-on-surface-variant" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary font-body">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </Link>
      )}
    </header>
  )
}
