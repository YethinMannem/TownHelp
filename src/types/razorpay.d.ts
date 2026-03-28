interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    name?: string
    email?: string | null
    contact?: string | null
  }
  theme?: {
    color?: string
  }
  handler: (response: RazorpaySuccessResponse) => void
  modal?: {
    ondismiss?: () => void
    escape?: boolean
    confirm_close?: boolean
  }
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  close(): void
  on(event: string, handler: (response: unknown) => void): void
}

interface Window {
  Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance
}
