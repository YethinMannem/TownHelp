import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div
          className="w-16 h-16 rounded-full bg-secondary-fixed flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <span className="text-2xl">🔍</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-on-surface font-headline">
            Page not found
          </h1>
          <p className="text-sm text-on-surface-variant">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/"
            className="w-full h-11 bg-brand-gradient text-on-primary text-sm font-medium rounded-lg hover:opacity-90 active:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary inline-flex items-center justify-center"
          >
            Go home
          </Link>
          <Link
            href="/browse"
            className="w-full h-11 bg-surface-container text-on-surface text-sm font-medium rounded-lg border border-outline-variant hover:bg-surface-container-high active:bg-surface-container-highest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-outline inline-flex items-center justify-center"
          >
            Browse providers
          </Link>
        </div>
      </div>
    </div>
  )
}
