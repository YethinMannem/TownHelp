'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Heart, User, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface NavItem {
  label: string
  href: string
  Icon: LucideIcon
  matchPaths: string[]
}

function isHidden(pathname: string): boolean {
  return (
    pathname === '/welcome' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth')
  )
}

interface BottomNavProps {
  unreadMessagesCount?: number
}

let hasHydrated = false

function subscribeToHydrationStore(onStoreChange: () => void): () => void {
  if (!hasHydrated) {
    queueMicrotask(() => {
      hasHydrated = true
      onStoreChange()
    })
  }
  return () => {}
}

function getClientSnapshot(): boolean {
  return hasHydrated
}

function getServerSnapshot(): boolean {
  return false
}

export default function BottomNav({ unreadMessagesCount = 0 }: BottomNavProps) {
  const pathname = usePathname()
  const mounted = useSyncExternalStore(
    subscribeToHydrationStore,
    getClientSnapshot,
    getServerSnapshot
  )

  const navItems: NavItem[] = [
    { label: 'Home', href: '/', Icon: Home, matchPaths: ['/'] },
    { label: 'Bookings', href: '/bookings', Icon: CalendarDays, matchPaths: ['/bookings'] },
    { label: 'Messages', href: '/chat', Icon: MessageCircle, matchPaths: ['/chat'] },
    { label: 'Favorites', href: '/favorites', Icon: Heart, matchPaths: ['/favorites'] },
    { label: 'Account', href: '/profile', Icon: User, matchPaths: ['/profile'] },
  ]

  if (!mounted || isHidden(pathname)) return null

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        aria-label="Bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 shadow-[0_-12px_32px_rgba(0,0,0,0.07)] lg:hidden"
      >
        <div className="grid grid-cols-5 items-center px-2 h-16 max-w-lg mx-auto w-full">
          {navItems.map(({ label, href, Icon, matchPaths }) => {
            const isActive = matchPaths.some((p) =>
              p === '/' ? pathname === '/' : pathname.startsWith(p)
            )
            const showUnreadBadge = label === 'Messages' && unreadMessagesCount > 0
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-150 rounded-2xl',
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                <div
                  className={cn(
                    'relative flex items-center justify-center w-16 h-8 rounded-full transition-colors duration-150',
                    isActive ? 'bg-primary-fixed' : ''
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'
                    )}
                  />
                  {showUnreadBadge && (
                    <span className="absolute -top-1 right-1 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary font-body">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn('text-[10px] sm:text-[11px] font-body leading-tight truncate', isActive ? 'font-semibold' : 'font-medium')}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Desktop sidebar nav */}
      <nav
        aria-label="Sidebar navigation"
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 w-60 bg-surface-container-lowest border-r border-outline-variant/20 flex-col py-6 px-3 shadow-[8px_0_28px_rgba(0,0,0,0.03)]"
      >
        {/* Brand */}
        <div className="px-3 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-on-primary font-headline font-extrabold">
              T
            </span>
            <span>
              <span className="block font-headline text-xl font-extrabold text-on-surface leading-tight">
                TownHelp
              </span>
              <span className="block text-xs text-on-surface-variant font-body">
                Local services
              </span>
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <div className="flex-1 flex flex-col gap-1">
          {navItems.map(({ label, href, Icon, matchPaths }) => {
            const isActive = matchPaths.some((p) =>
              p === '/' ? pathname === '/' : pathname.startsWith(p)
            )
            const showUnreadBadge = label === 'Messages' && unreadMessagesCount > 0
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 font-body text-sm',
                  isActive
                    ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'
                  )}
                />
                {label}
                {showUnreadBadge && (
                  <span className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary font-body">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
