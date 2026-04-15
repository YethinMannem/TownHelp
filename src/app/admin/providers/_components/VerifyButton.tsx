'use client'

import { useTransition } from 'react'
import { setProviderVerified } from '@/app/actions/admin'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface VerifyButtonProps {
  providerId: string
  isVerified: boolean
}

export default function VerifyButton({ providerId, isVerified }: VerifyButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleClick(): void {
    startTransition(async () => {
      const result = await setProviderVerified(providerId, !isVerified)
      if (result.success) {
        toast(
          isVerified ? 'Provider unverified.' : 'Provider verified.',
          'success'
        )
      } else {
        toast(result.error ?? 'Failed to update verification status.', 'error')
      }
    })
  }

  return (
    <Button
      variant={isVerified ? 'ghost' : 'primary'}
      size="sm"
      loading={isPending}
      onClick={handleClick}
    >
      {isVerified ? 'Unverify' : 'Verify'}
    </Button>
  )
}
