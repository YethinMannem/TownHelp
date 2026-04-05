import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function WelcomePage() {
  // Already logged in → go straight to home
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/')

  return (
    <div className="relative min-h-screen bg-surface overflow-hidden flex flex-col items-center">
      {/* Organic background blobs */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-primary-fixed opacity-60 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-secondary-fixed opacity-50 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 left-1/3 w-48 h-48 rounded-full bg-tertiary-fixed opacity-30 blur-2xl pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 items-center justify-between px-6 py-16 w-full max-w-lg">

        {/* Logo + headline */}
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="w-20 h-20 rounded-3xl bg-brand-gradient flex items-center justify-center shadow-lg">
            <MapPin className="w-10 h-10 text-on-primary" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="font-headline text-4xl font-extrabold text-on-surface leading-tight">
              TownHelp
            </h1>
            <p className="mt-2 text-base text-on-surface-variant font-body max-w-xs text-center leading-relaxed">
              Trusted neighborhood services,<br />right at your doorstep.
            </p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="w-full max-w-sm flex flex-col gap-4 mb-8">
          <Link
            href="/login?role=requester"
            className="w-full flex items-center justify-center gap-3 bg-brand-gradient text-on-primary font-semibold text-base rounded-2xl px-6 py-4 shadow-md hover:opacity-90 active:opacity-80 transition-opacity font-body"
          >
            <div className="w-10 h-10 rounded-xl bg-on-primary/10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-bold text-base">I need services</div>
              <div className="text-xs opacity-80">Find maids, cooks &amp; more</div>
            </div>
          </Link>

          <Link
            href="/login?role=provider"
            className="w-full flex items-center justify-center gap-3 bg-secondary-fixed text-on-secondary-fixed font-semibold text-base rounded-2xl px-6 py-4 border border-outline-variant/30 hover:bg-secondary-fixed-dim active:bg-secondary-fixed-dim transition-colors font-body"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-bold text-base">I offer services</div>
              <div className="text-xs opacity-70">Start earning in your area</div>
            </div>
          </Link>

          <p className="text-center text-sm text-on-surface-variant font-body">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
