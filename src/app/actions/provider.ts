'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import type { ProviderServiceItem } from '@/types'

// --- Helper ---

async function requireProviderProfile(userId: string): Promise<{ id: string }> {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId, deletedAt: null },
    select: { id: true },
  })
  if (!profile) {
    redirect('/provider/register')
  }
  return profile
}

export async function createProviderProfile(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()

  const existingProfile = await prisma.providerProfile.findUnique({
    where: { userId: authUser.id, deletedAt: null },
    select: { id: true },
  })

  if (existingProfile) {
    redirect('/provider/dashboard')
  }

  const displayName = formData.get('displayName') as string
  const baseRate = parseFloat(formData.get('baseRate') as string)
  const bio = formData.get('bio') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const locationLabel = ((formData.get('locationLabel') as string) ?? '').trim()
  const locationCity = ((formData.get('locationCity') as string) ?? '').trim()
  const locationState = ((formData.get('locationState') as string) ?? '').trim()
  const radiusKm = parseInt(formData.get('radiusKm') as string, 10) || 5

  if (!displayName?.trim() || isNaN(baseRate) || baseRate <= 0) {
    throw new Error('Display name and a valid base rate are required.')
  }

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Please share your location so customers can find you.')
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.providerProfile.create({
      data: {
        userId: authUser.id,
        displayName: displayName.trim(),
        baseRate,
        bio: bio?.trim() || null,
        isAvailable: true,
        isVerified: false,
        ratingAvg: 0,
        ratingCount: 0,
        ratingSum: 0,
        completedBookings: 0,
        latitude: lat,
        longitude: lng,
        maxTravelRadiusKm: radiusKm,
      },
      select: { id: true },
    })

    await tx.serviceArea.createMany({
      data: [
        {
          providerId: profile.id,
          areaName: locationLabel || locationCity || 'My Area',
          city: locationCity || undefined,
          state: locationState || undefined,
          latitude: lat,
          longitude: lng,
          radiusKm: radiusKm,
          isPrimary: true,
        },
      ],
    })

    await tx.user.update({
      where: { id: authUser.id },
      data: {
        metadata: {
          locationLabel,
          city: locationCity || undefined,
          state: locationState || undefined,
          locationLat: lat,
          locationLng: lng,
        },
      },
    })
  })

  redirect('/provider/add-service')
}

export async function addProviderService(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const categoryId = formData.get('categoryId') as string
  const customRate = parseFloat(formData.get('customRate') as string)
  const rateType = formData.get('rateType') as string
  const description = formData.get('description') as string

  if (!categoryId) {
    throw new Error('Please select a service category.')
  }

  const validRateTypes = ['HOURLY', 'PER_VISIT', 'FIXED', 'PER_KG'] as const
  const resolvedRateType = validRateTypes.includes(rateType as typeof validRateTypes[number])
    ? (rateType as typeof validRateTypes[number])
    : 'HOURLY'

  try {
    await prisma.providerService.create({
      data: {
        providerId: profile.id,
        categoryId,
        customRate: isNaN(customRate) ? null : customRate,
        rateType: resolvedRateType,
        description: description?.trim() || null,
        isActive: true,
      },
    })
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new Error('You already offer this service. Go to your dashboard to edit it.')
    }
    throw new Error('Failed to add service. Please try again.')
  }

  redirect('/provider/dashboard')
}

// --- Profile Editing ---

export async function updateProviderProfile(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await requireAuthUser()
    const profile = await requireProviderProfile(authUser.id)

    const displayName = formData.get('displayName') as string
    const baseRate = parseFloat(formData.get('baseRate') as string)
    const bio = formData.get('bio') as string
    const isAvailable = formData.get('isAvailable') === 'true'
    const rawLat = formData.get('lat') as string
    const rawLng = formData.get('lng') as string
    const locationLabel = ((formData.get('locationLabel') as string) ?? '').trim()
    const locationCity = ((formData.get('locationCity') as string) ?? '').trim()
    const locationState = ((formData.get('locationState') as string) ?? '').trim()
    const radiusKm = parseInt(formData.get('radiusKm') as string, 10) || 5
    const lat = rawLat ? parseFloat(rawLat) : null
    const lng = rawLng ? parseFloat(rawLng) : null

    if (!displayName?.trim() || isNaN(baseRate) || baseRate <= 0) {
      return { success: false, error: 'Display name and a valid base rate are required.' }
    }

    const hasLocation = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)

    await prisma.$transaction(async (tx) => {
      await tx.providerProfile.update({
        where: { id: profile.id },
        data: {
          displayName: displayName.trim(),
          baseRate,
          bio: bio?.trim() || null,
          isAvailable,
          ...(hasLocation && { latitude: lat, longitude: lng, maxTravelRadiusKm: radiusKm }),
        },
      })

      if (hasLocation) {
        await tx.serviceArea.deleteMany({ where: { providerId: profile.id } })
        await tx.serviceArea.createMany({
          data: [{
            providerId: profile.id,
            areaName: locationLabel || locationCity || 'My Area',
            city: locationCity || undefined,
            state: locationState || undefined,
            latitude: lat!,
            longitude: lng!,
            radiusKm,
            isPrimary: true,
          }],
        })

        await tx.user.update({
          where: { id: authUser.id },
          data: {
            metadata: {
              locationLabel,
              city: locationCity || undefined,
              state: locationState || undefined,
              locationLat: lat,
              locationLng: lng,
            },
          },
        })
      }
    })

    revalidatePath('/provider/dashboard')
    revalidatePath('/provider/edit')
    revalidatePath('/browse')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile.'
    return { success: false, error: message }
  }
}

// --- Service Editing ---

export async function updateProviderService(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const serviceId = formData.get('serviceId') as string
  const customRate = parseFloat(formData.get('customRate') as string)
  const rateType = formData.get('rateType') as string
  const description = formData.get('description') as string

  if (!serviceId) {
    throw new Error('Service ID is required.')
  }

  const validRateTypes = ['HOURLY', 'PER_VISIT', 'FIXED', 'PER_KG'] as const
  const resolvedRateType = validRateTypes.includes(rateType as typeof validRateTypes[number])
    ? (rateType as typeof validRateTypes[number])
    : undefined

  await prisma.providerService.updateMany({
    where: { id: serviceId, providerId: profile.id },
    data: {
      customRate: isNaN(customRate) ? null : customRate,
      ...(resolvedRateType && { rateType: resolvedRateType }),
      description: description?.trim() || null,
    },
  })

  revalidatePath('/provider/dashboard')
  redirect('/provider/dashboard')
}

export async function deactivateProviderService(serviceId: string): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  await prisma.providerService.updateMany({
    where: { id: serviceId, providerId: profile.id },
    data: { isActive: false },
  })

  revalidatePath('/provider/dashboard')
}

export async function reactivateProviderService(serviceId: string): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  await prisma.providerService.updateMany({
    where: { id: serviceId, providerId: profile.id },
    data: { isActive: true },
  })

  revalidatePath('/provider/dashboard')
}

// --- Service Area Management ---

export async function addServiceArea(formData: FormData): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const areaName = (formData.get('areaName') as string)?.trim()

  if (!areaName) {
    throw new Error('Area name is required.')
  }

  await prisma.serviceArea.create({
    data: {
      providerId: profile.id,
      areaName,
      isPrimary: false,
    },
  })

  revalidatePath('/provider/dashboard')
  redirect('/provider/dashboard')
}

export async function removeServiceArea(areaId: string): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  // Don't allow removing the last area
  const areaCount = await prisma.serviceArea.count({
    where: { providerId: profile.id },
  })

  if (areaCount <= 1) {
    throw new Error('You must have at least one service area.')
  }

  await prisma.serviceArea.deleteMany({
    where: { id: areaId, providerId: profile.id },
  })

  revalidatePath('/provider/dashboard')
}

// --- Public Provider Detail ---

export interface ProviderDetail {
  id: string
  userId: string
  displayName: string
  bio: string | null
  baseRate: number
  ratingAvg: number
  ratingCount: number
  completedBookings: number
  isVerified: boolean
  isBackgroundChecked: boolean
  isAvailable: boolean
  whatsappOptIn: boolean
  services: ProviderServiceItem[]
  areas: {
    areaName: string
    city: string
    pincode: string | null
    isPrimary: boolean
  }[]
}

export interface ProviderContact {
  phone: string | null
  whatsappNumber: string | null
}

export async function getProviderById(id: string): Promise<ProviderDetail | null> {
  await requireAuthUser()

  const profile = await prisma.providerProfile.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      userId: true,
      displayName: true,
      bio: true,
      baseRate: true,
      ratingAvg: true,
      ratingCount: true,
      completedBookings: true,
      isVerified: true,
      isBackgroundChecked: true,
      isAvailable: true,
      services: {
        where: { isActive: true },
        select: {
          id: true,
          customRate: true,
          rateType: true,
          description: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconName: true,
            },
          },
        },
      },
      whatsappOptIn: true,
      serviceAreas: {
        select: {
          areaName: true,
          city: true,
          pincode: true,
          isPrimary: true,
        },
        orderBy: { isPrimary: 'desc' },
      },
    },
  })

  if (!profile) return null

  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    baseRate: Number(profile.baseRate),
    ratingAvg: Number(profile.ratingAvg),
    ratingCount: profile.ratingCount,
    completedBookings: profile.completedBookings,
    isVerified: profile.isVerified,
    isBackgroundChecked: profile.isBackgroundChecked,
    isAvailable: profile.isAvailable,
    whatsappOptIn: profile.whatsappOptIn,
    services: profile.services.map((s) => ({
      id: s.id,
      customRate: s.customRate ? Number(s.customRate) : null,
      rateType: s.rateType,
      description: s.description,
      category: s.category,
    })),
    areas: profile.serviceAreas,
  }
}

// Contact info is gated: only unlock for confirmed/active bookings between viewer and provider.
export async function getProviderContact(providerId: string): Promise<ProviderContact | null> {
  const authUser = await requireAuthUser()

  const profile = await prisma.providerProfile.findUnique({
    where: { id: providerId, deletedAt: null },
    select: { userId: true },
  })
  if (!profile) return null

  const activeBooking = await prisma.booking.findFirst({
    where: {
      requesterId: authUser.id,
      providerId: providerId,
      status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
    },
    select: { id: true },
  })

  if (!activeBooking) return null

  const user = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { phone: true, whatsappNumber: true },
  })

  return {
    phone: user?.phone ?? null,
    whatsappNumber: user?.whatsappNumber ?? null,
  }
}

export async function toggleAvailability(): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  await prisma.$executeRaw`
    UPDATE provider_profiles
    SET is_available = NOT is_available, updated_at = NOW()
    WHERE id = ${profile.id}::uuid
  `

  revalidatePath('/provider/dashboard')
}

// --- Availability Hours ---

export async function updateAvailabilityHours(
  availableFrom: string,
  availableTo: string,
): Promise<void> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  // Validate HH:MM format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(availableFrom) || !timeRegex.test(availableTo)) {
    throw new Error('Invalid time format. Use HH:MM (24-hour).')
  }

  // Store times as DateTime using a fixed epoch date (time component only matters)
  // Prisma @db.Time() stores only the time part; using 1970-01-01 as the date carrier.
  const fromDate = new Date(`1970-01-01T${availableFrom}:00.000Z`)
  const toDate = new Date(`1970-01-01T${availableTo}:00.000Z`)

  if (fromDate >= toDate) {
    throw new Error('Start time must be before end time.')
  }

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      availableFrom: fromDate,
      availableTo: toDate,
    },
  })

  revalidatePath('/provider/dashboard')
  revalidatePath('/provider/availability')
}

// =============================================================================
// Weekly Availability Schedule
// =============================================================================

interface AvailabilitySlotInput {
  dayOfWeek: number
  startTime: string   // "HH:MM" 24-hour
  endTime: string     // "HH:MM" 24-hour
  isActive: boolean
}

export async function setWeeklyAvailability(
  slots: AvailabilitySlotInput[]
): Promise<{ success: boolean; error?: string }> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

  // Validate all slots
  for (const slot of slots) {
    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6 || !Number.isInteger(slot.dayOfWeek)) {
      return { success: false, error: `Invalid day of week: ${slot.dayOfWeek}` }
    }
    if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
      return { success: false, error: 'Invalid time format. Use HH:MM (24-hour).' }
    }
    if (slot.isActive && slot.startTime >= slot.endTime) {
      return { success: false, error: `Start time must be before end time for day ${slot.dayOfWeek}.` }
    }
  }

  // Check for duplicate days
  const days = slots.map((s) => s.dayOfWeek)
  if (new Set(days).size !== days.length) {
    return { success: false, error: 'Duplicate days in schedule.' }
  }

  try {
    // Atomic replace: delete existing + create new in one transaction
    await prisma.$transaction(async (tx) => {
      await tx.providerAvailability.deleteMany({
        where: { providerId: profile.id },
      })

      if (slots.length > 0) {
        await tx.providerAvailability.createMany({
          data: slots.map((slot) => ({
            providerId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: new Date(`1970-01-01T${slot.startTime}:00.000Z`),
            endTime: new Date(`1970-01-01T${slot.endTime}:00.000Z`),
            isActive: slot.isActive,
          })),
        })
      }
    })

    revalidatePath('/provider/dashboard')
    revalidatePath('/provider/availability')

    return { success: true }
  } catch (error) {
    console.error('[setWeeklyAvailability]:', error)
    return { success: false, error: 'Failed to update schedule. Please try again.' }
  }
}

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const

interface AvailabilitySlotResponse {
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  isActive: boolean
}

export async function getWeeklyAvailability(
  providerId?: string
): Promise<{ slots: AvailabilitySlotResponse[] }> {
  let profileId = providerId

  if (!profileId) {
    const authUser = await requireAuthUser()
    const profile = await requireProviderProfile(authUser.id)
    profileId = profile.id
  }

  const rows = await prisma.providerAvailability.findMany({
    where: { providerId: profileId },
    orderBy: { dayOfWeek: 'asc' },
  })

  // Build full 7-day schedule, filling in missing days as inactive
  const slots: AvailabilitySlotResponse[] = []

  for (let day = 0; day < 7; day++) {
    const existing = rows.find((r) => r.dayOfWeek === day)

    if (existing) {
      // Extract HH:MM from the stored Time value
      const start = existing.startTime instanceof Date
        ? existing.startTime.toISOString().slice(11, 16)
        : '09:00'
      const end = existing.endTime instanceof Date
        ? existing.endTime.toISOString().slice(11, 16)
        : '17:00'

      slots.push({
        dayOfWeek: day,
        dayName: DAY_NAMES[day],
        startTime: start,
        endTime: end,
        isActive: existing.isActive,
      })
    } else {
      slots.push({
        dayOfWeek: day,
        dayName: DAY_NAMES[day],
        startTime: '09:00',
        endTime: '17:00',
        isActive: false,
      })
    }
  }

  return { slots }
}

// --- WhatsApp settings ---

interface WhatsAppResult {
  success: boolean
  error?: string
}

/** Toggle whether this provider's WhatsApp contact button is shown on their public profile. */
export async function toggleWhatsappOptIn(enabled: boolean): Promise<WhatsAppResult> {
  const authUser = await requireAuthUser()
  const profile = await requireProviderProfile(authUser.id)

  try {
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { whatsappOptIn: enabled },
    })
    revalidatePath('/provider/dashboard')
    revalidatePath('/provider', 'layout')
    return { success: true }
  } catch (error) {
    console.error('[toggleWhatsappOptIn]:', error)
    return { success: false, error: 'Failed to update WhatsApp setting.' }
  }
}

/** Normalize an Indian phone number to +91XXXXXXXXXX format. Returns null if invalid. */
function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  // Strip leading 91 if 12 digits, otherwise expect 10 digits
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  if (local.length !== 10) return null
  return `+91${local}`
}

/** Update the WhatsApp number stored on the provider's User record. */
export async function updateWhatsappNumber(formData: FormData): Promise<WhatsAppResult> {
  const authUser = await requireAuthUser()

  const raw = ((formData.get('whatsappNumber') as string | null) ?? '').trim()

  if (!raw) {
    // Allow clearing the number
    await prisma.user.update({
      where: { id: authUser.id },
      data: { whatsappNumber: null },
    })
    revalidatePath('/provider/dashboard')
    return { success: true }
  }

  const normalized = normalizeIndianPhone(raw)
  if (!normalized) {
    return { success: false, error: 'Enter a valid 10-digit Indian mobile number.' }
  }

  try {
    await prisma.user.update({
      where: { id: authUser.id },
      data: { whatsappNumber: normalized },
    })
    revalidatePath('/provider/dashboard')
    return { success: true }
  } catch (error) {
    console.error('[updateWhatsappNumber]:', error)
    return { success: false, error: 'Failed to save number. Please try again.' }
  }
}
