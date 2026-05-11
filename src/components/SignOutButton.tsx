'use client'

import { authService } from '@/services/auth.service'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SignOutButtonProps {
  compact?: boolean
  className?: string
}

export default function SignOutButton({
  compact = false,
  className,
}: SignOutButtonProps) {
  const router = useRouter()

  async function handleSignOut() {
    await authService.signOut()
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      registration?.active?.postMessage({ type: 'CLEAR_APP_CACHES' })
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        compact
          ? 'flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 py-1 text-on-surface-variant hover:text-on-surface transition-colors duration-150'
          : 'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors',
        className
      )}
      aria-label="Sign out"
    >
      {compact ? (
        <>
          <div className="flex items-center justify-center w-16 h-8 rounded-full">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-body leading-tight truncate">
            Sign Out
          </span>
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </>
      )}
    </button>
  )
}
