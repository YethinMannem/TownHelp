import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-on-surface font-headline">TownHelp</h1>
          <p className="mt-2 text-on-surface-variant font-body text-sm">
            Find trusted local services in your neighborhood
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center text-on-surface-variant text-sm py-4 font-body">Loading...</div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-outline font-body">
          Secure sign-in with email and password
        </p>
      </div>
    </div>
  )
}
