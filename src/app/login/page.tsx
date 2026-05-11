import { Suspense } from 'react'
import LoginForm from './LoginForm'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-surface px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center">
          <Link href="/welcome" className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-gradient shadow-lg shadow-primary/20">
            <MapPin className="h-8 w-8 text-on-primary" />
          </Link>
          <h1 className="text-3xl font-extrabold text-on-surface font-headline">Welcome back</h1>
          <p className="mt-2 text-on-surface-variant font-body text-sm">
            Find trusted local services in your neighborhood
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
          <Suspense fallback={
            <div className="text-center text-on-surface-variant text-sm py-4 font-body">Loading...</div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-xs text-outline font-body">
          Secure sign-in with email and password
        </p>
      </div>
    </div>
  )
}
