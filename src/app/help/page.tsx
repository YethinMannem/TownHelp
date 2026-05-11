import { ArrowLeft, LifeBuoy } from 'lucide-react'
import Link from 'next/link'
import FaqAccordion from './_components/FaqAccordion'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help & Support — TownHelp',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/profile"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Back to account"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline text-base font-bold text-on-surface">Help &amp; Support</h1>
      </header>

      <div className="pt-14 px-4 lg:px-8 max-w-2xl mx-auto mt-5 space-y-5">
        <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
              <LifeBuoy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface">How can we help?</h2>
              <p className="mt-1 text-sm text-on-surface-variant font-body leading-relaxed">
                Find answers about bookings, payments, cancellations, and provider support.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <div>
          <p className="text-xs font-body font-semibold text-on-surface-variant uppercase tracking-wide px-1 mb-2">
            Frequently Asked Questions
          </p>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <FaqAccordion />
          </div>
        </div>

        {/* Cancellation Policy */}
        <div>
          <p className="text-xs font-body font-semibold text-on-surface-variant uppercase tracking-wide px-1 mb-2">
            Cancellation Policy
          </p>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 space-y-3">
            {[
              'Free cancellation: Cancel more than 2 hours before the scheduled time — no charge.',
              'Late cancellation: Cancelling within 2 hours of the scheduled time may result in a \u20b950\u2013\u20b9100 fee at the provider\u2019s discretion.',
              'No-shows: If you\u2019re not home when the provider arrives, the booking may be charged.',
              'Provider cancellation: If the provider cancels, you will not be charged and we\u2019ll help you find an alternative.',
            ].map((line, i) => (
              <p key={i} className="text-sm font-body text-on-surface-variant leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div>
          <p className="text-xs font-body font-semibold text-on-surface-variant uppercase tracking-wide px-1 mb-2">
            Need More Help?
          </p>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 space-y-4">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '919000000000'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-3 text-sm font-body font-semibold text-on-primary hover:opacity-90 transition-opacity"
            >
              Chat with us on WhatsApp
            </a>
            <div className="space-y-1">
              <p className="text-xs font-body text-on-surface-variant">Email</p>
              <a
                href="mailto:help@townhelp.in"
                className="text-sm font-body text-primary hover:underline"
              >
                help@townhelp.in
              </a>
            </div>
            <p className="text-xs font-body text-on-surface-variant">
              We&apos;re available Monday&ndash;Saturday, 9 AM to 7 PM
            </p>
          </div>
        </div>

        <div className="pb-4" />
      </div>
    </div>
  )
}
