import type { BookingStatus, RateType } from '@/generated/prisma'

// Re-export Prisma enums for convenience
export type { BookingStatus, RateType } from '@/generated/prisma'

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
  user: {
    fullName: string
    phone: string | null
  }
  services: ProviderServiceItem[]
  areas: ServiceAreaItem[]
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
  services: ProviderServiceItem[]
  areas: ServiceAreaItem[]
}

// --- Bookings ---

export interface BookingAsRequester {
  id: string
  bookingNumber: string
  status: BookingStatus
  quotedRate: number | null
  serviceAddress: string | null
  requesterNotes: string | null
  createdAt: Date
  provider: {
    displayName: string
  }
  category: {
    name: string
    iconName: string | null
  }
}

export interface BookingAsProvider {
  id: string
  bookingNumber: string
  status: BookingStatus
  quotedRate: number | null
  serviceAddress: string | null
  requesterNotes: string | null
  createdAt: Date
  requester: {
    fullName: string
    phone: string | null
  }
  category: {
    name: string
    iconName: string | null
  }
}

export interface MyBookings {
  asRequester: BookingAsRequester[]
  asProvider: BookingAsProvider[]
}
