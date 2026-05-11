import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, BadgeCheck, IndianRupee, Shield, Home, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function WelcomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/')

  return (
    <div className="min-h-screen min-h-dvh bg-surface flex flex-col items-center">
      <div className="flex w-full max-w-lg flex-1 flex-col justify-between px-5 py-10 sm:py-14">

        {/* Logo + headline */}
        <div className="flex flex-col items-center gap-6 pt-[env(safe-area-inset-top)]">
          <div className="w-20 h-20 rounded-3xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/20">
            <MapPin className="w-10 h-10 text-on-primary" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="font-headline text-4xl font-extrabold text-on-surface leading-tight">
              TownHelp
            </h1>
            <p className="mt-3 text-base text-on-surface-variant font-body max-w-xs text-center leading-relaxed">
              Trusted neighborhood services, right at your doorstep.
            </p>
          </div>
        </div>

        {/* Value propositions */}
        <div className="my-10 w-full space-y-2.5 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-sm">
          {[
            { icon: BadgeCheck, title: 'Verified providers', desc: 'Every provider is ID-checked before they can accept bookings' },
            { icon: IndianRupee, title: 'Upfront pricing', desc: 'See the rate before you book. Pay only after the job is done' },
            { icon: Shield, title: 'Safe & reliable', desc: 'Disputes resolved within 24 hours. Your home, protected' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl px-3 py-2">
              <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface font-body">{title}</p>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="w-full flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
          <Link
            href="/login?role=requester"
            className="w-full flex items-center justify-center gap-3 bg-brand-gradient text-on-primary font-semibold text-base rounded-2xl px-5 py-4 shadow-md shadow-primary/20 hover:opacity-90 active:opacity-80 transition-opacity font-body"
          >
            <div className="w-10 h-10 rounded-xl bg-on-primary/10 flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5" />
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
              <Briefcase className="w-5 h-5" />
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
          <p className="text-center text-xs text-on-surface-variant font-body mt-2">
            Trusted by families in Kukatpally, KPHB &amp; Miyapur
          </p>
        </div>

      </div>
    </div>
  )
}
