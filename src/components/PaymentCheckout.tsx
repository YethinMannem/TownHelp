/*
'use client'

import { useState, useCallback } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import type { CreatePaymentOrderResponse } from '@/types/payment'

interface PaymentCheckoutProps {
  bookingId: string
  amount: number         // in rupees, for display
  bookingNumber: string
}

type PaymentState = 'idle' | 'creating' | 'paying' | 'verifying' | 'success' | 'error'

export default function PaymentCheckout({ bookingId, amount, bookingNumber }: PaymentCheckoutProps) {
  const router = useRouter()
  const [state, setState] = useState<PaymentState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const handlePayment = useCallback(async () => {
    if (!scriptLoaded) {
      setErrorMessage('Payment system is loading. Please try again.')
      return
    }

    setState('creating')
    setErrorMessage(null)

    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json()
        throw new Error(err.error || 'Failed to create payment order.')
      }

      const orderData: CreatePaymentOrderResponse = await orderRes.json()

      // 2. Open Razorpay checkout
      setState('paying')

      const options: RazorpayCheckoutOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TownHelp',
        description: `Booking ${orderData.bookingNumber}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.prefill.name,
          email: orderData.prefill.email,
          contact: orderData.prefill.contact,
        },
        theme: { color: '#2563eb' },
        handler: async (response: RazorpaySuccessResponse) => {
          // 3. Verify payment on server
          setState('verifying')

          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })

            if (!verifyRes.ok) {
              const err = await verifyRes.json()
              throw new Error(err.error || 'Payment verification failed.')
            }

            setState('success')
            // Refresh page data to reflect payment status
            router.refresh()
          } catch (verifyError) {
            console.error('[PaymentCheckout] verification failed:', verifyError)
            setState('error')
            setErrorMessage(
              'Payment was received but verification failed. It will be confirmed shortly.'
            )
          }
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setState('idle')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('[PaymentCheckout] error:', error)
      setState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    }
  }, [bookingId, scriptLoaded, router])

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      {state === 'success' ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-sm font-medium text-green-800">Payment successful!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handlePayment}
            disabled={state === 'creating' || state === 'paying' || state === 'verifying'}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white
                       transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {state === 'creating' && 'Creating order...'}
            {state === 'paying' && 'Complete payment in popup...'}
            {state === 'verifying' && 'Verifying payment...'}
            {(state === 'idle' || state === 'error') && `Pay ₹${amount}`}
          </button>

          {errorMessage && (
            <p className="text-xs text-red-600 text-center">{errorMessage}</p>
          )}

          <p className="text-xs text-gray-500 text-center">
            Booking {bookingNumber} &middot; UPI, Cards, Wallets accepted
          </p>
        </div>
      )}
    </>
  )
}
*/

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmPayment } from '@/app/actions/booking'

interface PaymentCheckoutProps {
  bookingId: string
  amount: number
  bookingNumber: string
}

type PaymentState = 'idle' | 'confirming' | 'success' | 'error'

export default function PaymentCheckout({ bookingId, amount, bookingNumber }: PaymentCheckoutProps) {
  const router = useRouter()
  const [state, setState] = useState<PaymentState>('idle')
  const [method, setMethod] = useState<'CASH' | 'UPI'>('CASH')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleConfirm() {
    setState('confirming')
    setErrorMessage(null)

    try {
      const result = await confirmPayment(bookingId, method)

      if (!result.success) {
        setState('error')
        setErrorMessage(result.error || 'Failed to confirm payment.')
        return
      }

      setState('success')
      router.refresh()
    } catch {
      setState('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-lg bg-primary-fixed border border-primary-fixed-dim p-3 text-center">
        <p className="text-sm font-medium text-on-primary-fixed">Payment confirmed!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-on-surface-variant">
        Pay the provider directly and confirm below.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMethod('CASH')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
            method === 'CASH'
              ? 'border-primary bg-primary-fixed text-on-primary-fixed'
              : 'border-outline-variant text-on-surface-variant hover:border-outline'
          }`}
        >
          Cash
        </button>
        <button
          type="button"
          onClick={() => setMethod('UPI')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
            method === 'UPI'
              ? 'border-primary bg-primary-fixed text-on-primary-fixed'
              : 'border-outline-variant text-on-surface-variant hover:border-outline'
          }`}
        >
          UPI
        </button>
      </div>
      <button
        onClick={handleConfirm}
        disabled={state === 'confirming'}
        className="w-full rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-on-primary
                   transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'confirming' ? 'Confirming...' : `I paid ₹${amount}`}
      </button>

      {errorMessage && (
        <p className="text-xs text-error text-center">{errorMessage}</p>
      )}

      <p className="text-xs text-on-surface-variant text-center">
        Booking {bookingNumber}
      </p>
    </div>
  )
}
