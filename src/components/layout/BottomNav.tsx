'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Heart, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface NavItem {
  label: string
  href: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', Icon: Home },
  { label: 'Bookings', href: '/bookings', Icon: CalendarDays },
  { label: 'Favorites', href: '/favorites', Icon: Heart },
  { label: 'Profile', href: '/provider/dashboard', Icon: User },
]

function isHidden(pathname: string): boolean {
  return (
    pathname === '/welcome' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth')
  )
}

export default function BottomNav() {
  const pathname = usePathname()

  if (isHidden(pathname)) return null

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md rounded-t-[2rem] border-t border-outline-variant/20 shadow-[0_-2px_16px_rgba(27,28,27,0.06)]"
    >
      <div className="flex items-center justify-around px-4 py-2">
        {NAV_ITEMS.map(({ label, href, Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-150',
                isActive
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive ? 'stroke-[2.5]' : 'stroke-2'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-body',
                  isActive ? 'font-bold' : 'font-medium'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
