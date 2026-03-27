import type { BookingStatus } from '@/generated/prisma'

// Shared test constants — single source of truth across all test files

export const REQUESTER_ID = 'requester-uuid'
export const PROVIDER_USER_ID = 'provider-user-uuid'
export const PROVIDER_PROFILE_ID = 'provider-profile-uuid'
export const BOOKING_ID = 'booking-uuid'
export const CONVERSATION_ID = 'conv-uuid'
export const OTHER_USER_ID = 'stranger-uuid'

export function makeBooking(status: BookingStatus) {
  return {
    id: BOOKING_ID,
    bookingNumber: 'BK-001',
    status,
    requesterId: REQUESTER_ID,
    providerId: PROVIDER_PROFILE_ID,
    provider: { userId: PROVIDER_USER_ID },
  }
}

export function makeCompletedBooking() {
  return {
    id: BOOKING_ID,
    status: 'COMPLETED' as const,
    requesterId: REQUESTER_ID,
    provider: { id: PROVIDER_PROFILE_ID, userId: PROVIDER_USER_ID },
  }
}

export function makeConversation(overrides = {}) {
  return {
    requesterId: REQUESTER_ID,
    provider: { userId: PROVIDER_USER_ID },
    ...overrides,
  }
}
