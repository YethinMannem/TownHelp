import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">TownHelp</h1>
          <p className="mt-2 text-gray-600">
            Find trusted local services in your neighborhood
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center text-gray-400 text-sm py-4">Loading...</div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-gray-400">
          Passwordless sign-in powered by magic link
        </p>
      </div>
    </div>
  )
}
