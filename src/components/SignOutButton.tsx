'use client'

import { authService } from '@/services/auth.service'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await authService.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      Sign Out
    </button>
  )
}
