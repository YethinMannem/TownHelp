import type { BookingStatus, MessageType, NotificationType, PaymentStatus, RateType } from '@/generated/prisma'

// Re-export Prisma enums for convenience
export type { BookingStatus, MessageType, NotificationType, PaymentStatus, RateType } from '@/generated/prisma'

// Re-export payment types
export type {
  CreatePaymentOrderRequest,
  CreatePaymentOrderResponse,
  VerifyPaymentRequest,
  PaymentOrderResult,
  PaymentVerifyResult,
  BookingPaymentStatus,
} from './payment'

// --- Service Categories ---

export interface ServiceCategoryItem {
  id: string
  name: string
  slug: string
  iconName: string | null
  sortOrder: number
}

// --- Provider ---

export interface ProviderServiceItem {
  id: string
  customRate: number | null
  rateType: RateType | null
  description: string | null
  category: {
    id: string
    name: string
    slug: string
    iconName: string | null
  }
}

export interface ServiceAreaItem {
  areaName: string
  city: string
}

export interface ProviderListItem {
  id: string
  displayName: string
  bio: string | null
  baseRate: number
  ratingAvg: number
  ratingCount: number
  completedBookings: number
  isVerified: boolean
  availableFrom: Date | null
  availableTo: Date | null
  user: {
    fullName: string
  }
  services: ProviderServiceItem[]
  areas: ServiceAreaItem[]
}

export type ProviderSortOption = 'rating' | 'price_low' | 'price_high' | 'experience'

export interface ProviderListResult {
  providers: ProviderListItem[]
  totalCount: number
}

export interface ProviderDashboard {
  id: string
  displayName: string
  bio: string | null
  baseRate: number
  ratingAvg: number
  ratingCount: number
  isAvailable: boolean
  isVerified: boolean
  whatsappOptIn: boolean
  whatsappNumber: string | null
  services: ProviderServiceItem[]
  areas: ServiceAreaItem[]
}

// --- Bookings ---

export interface BookingActions {
  canConfirm: boolean
  canReject: boolean
  canStart: boolean
  canComplete: boolean
  canCancel: boolean
  canDispute: boolean
  awaitingPayment: boolean
}

export interface BookingTransitionResult {
  success: boolean
  error?: string
  booking?: { id: string; status: BookingStatus }
}

export interface BookingAsRequester {
  id: string
  conversationId: string | null
  bookingNumber: string
  status: BookingStatus
  quotedRate: number | null
  finalAmount: number | null
  serviceAddress: string | null
  requesterNotes: string | null
  createdAt: Date
  confirmedAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
  provider: {
    displayName: string
    userId: string
  }
  category: {
    name: string
    iconName: string | null
  }
  actions: BookingActions
  hasReview: boolean
  paymentStatus: 'NONE' | PaymentStatus
}

export interface BookingAsProvider {
  id: string
  conversationId: string | null
  bookingNumber: string
  status: BookingStatus
  quotedRate: number | null
  finalAmount: number | null
  serviceAddress: string | null
  requesterNotes: string | null
  createdAt: Date
  confirmedAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
  requesterId: string
  requester: {
    fullName: string
    phone: string | null
  }
  category: {
    name: string
    iconName: string | null
  }
  actions: BookingActions
  paymentStatus: 'NONE' | PaymentStatus
}

export interface MyBookings {
  asRequester: BookingAsRequester[]
  asProvider: BookingAsProvider[]
}

// --- Reviews ---

export interface ReviewResult {
  success: boolean
  error?: string
  review?: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
  }
}

export interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  reviewerName: string
  categoryName: string
}

// --- Chat ---

export interface ConversationItem {
  id: string
  bookingId: string
  bookingNumber: string
  bookingStatus: BookingStatus
  categoryName: string
  categoryIcon: string | null
  otherPartyName: string
  lastMessage: string | null
  lastMessageAt: Date
  unreadCount: number
}

export interface MessageItem {
  id: string
  senderId: string
  senderName: string
  content: string
  messageType: MessageType
  isRead: boolean
  createdAt: Date
  isMine: boolean
}

export interface SendMessageResult {
  success: boolean
  error?: string
  message?: {
    id: string
    content: string
    createdAt: Date
    senderId: string
  }
}

// --- Notifications ---

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

export interface NotificationSummary {
  notifications: NotificationItem[]
  unreadCount: number
}

// --- Provider Photos ---

export interface ProviderPhotoItem {
  id: string
  url: string
  caption: string | null
  sortOrder: number
  createdAt: Date
}

export interface UploadPhotoResult {
  success: boolean
  error?: string
  photo?: ProviderPhotoItem
}

// --- Weekly Availability ---

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export interface AvailabilitySlot {
  dayOfWeek: number
  dayName: string
  startTime: string    // "HH:MM" 24-hour format
  endTime: string      // "HH:MM" 24-hour format
  isActive: boolean
}

export interface WeeklyAvailability {
  slots: AvailabilitySlot[]
}

export interface SetAvailabilityResult {
  success: boolean
  error?: string
}

// --- Provider Dashboard Stats ---

export interface ProviderDashboardStats {
  bookingsThisMonth: number
  bookingsTotal: number
  earningsThisMonth: number
  earningsTotal: number
  averageRating: number
  totalReviews: number
  completionRate: number
  pendingRequests: number
  todaySchedule: TodayBookingItem[]
}

export interface TodayBookingItem {
  id: string
  bookingNumber: string
  status: string
  scheduledStart: Date | null
  serviceAddress: string | null
  requesterNotes: string | null
  requesterName: string
  categoryName: string
  categoryIcon: string | null
}
