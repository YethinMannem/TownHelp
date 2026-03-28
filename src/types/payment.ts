import type { PaymentStatus } from '@/generated/prisma'

// Re-export for convenience
export type { PaymentStatus } from '@/generated/prisma'

// --- Create Order ---

export interface CreatePaymentOrderRequest {
  bookingId: string
}

export interface CreatePaymentOrderResponse {
  orderId: string
  amount: number          // in paise (₹500 = 50000)
  currency: string        // "INR"
  keyId: string           // Razorpay key ID for checkout.js
  bookingNumber: string
  prefill: {
    name: string
    email: string | null
    contact: string | null
  }
}

// --- Verify Payment ---

export interface VerifyPaymentRequest {
  bookingId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

// --- Webhook ---

export interface RazorpayWebhookPayload {
  event: string
  payload: {
    payment: {
      entity: {
        id: string
        order_id: string
        amount: number
        currency: string
        status: string
        method: string
      }
    }
  }
}

// --- Service Layer Results ---

export interface PaymentOrderResult {
  success: boolean
  error?: string
  data?: CreatePaymentOrderResponse
}

export interface PaymentVerifyResult {
  success: boolean
  error?: string
  paymentId?: string
}

// --- UI State ---

export type BookingPaymentStatus = 'NONE' | PaymentStatus
