'use client'

import { useRouter } from 'next/navigation'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center space-y-4">
        <div
          className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-on-surface">
            Something went wrong
          </h1>
          <p className="text-sm text-on-surface-variant">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-outline mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="w-full h-11 bg-brand-gradient text-on-primary text-sm font-medium rounded-lg hover:opacity-90 active:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full h-11 bg-surface-container text-on-surface text-sm font-medium rounded-lg border border-outline-variant hover:bg-surface-container-high active:bg-surface-container-highest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-outline"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}
