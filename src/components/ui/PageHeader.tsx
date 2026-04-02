import type { HTMLAttributes } from 'react'
import { MapPin, Bell } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title?: string
  showLocation?: boolean
  showNotifications?: boolean
}

export function PageHeader({
  title,
  showLocation = false,
  showNotifications = true,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center justify-between',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {showLocation && (
          <MapPin className="w-4 h-4 text-primary" />
        )}
        <span className="font-headline font-bold text-base text-on-surface truncate max-w-[200px]">
          {showLocation ? 'Hyderabad' : title}
        </span>
      </div>

      {showNotifications && (
        <button
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <Bell className="w-5 h-5 text-on-surface-variant" />
        </button>
      )}
    </header>
  )
}
