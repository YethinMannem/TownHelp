'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getServiceCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name, slug, icon_name, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }

  return data
}

export async function getProviders(categorySlug?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('provider_profiles')
    .select(`
      id,
      display_name,
      bio,
      base_rate,
      rating_avg,
      rating_count,
      
      completed_bookings,
      is_verified,
      user:users!provider_profiles_user_id_fkey(full_name, phone),
      services:provider_services(
        id,
        custom_rate,
        rate_type,
        description,
        category:service_categories(id, name, slug, icon_name)
      ),
      areas:service_areas(area_name, city)
    `)
    .eq('is_available', true)
    .is('deleted_at', null)
    .order('rating_avg', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch providers:', error)
    return []
  }

  if (categorySlug && data) {
    return data.filter((provider: any) =>
      provider.services?.some((s: any) => s.category?.slug === categorySlug)
    )
  }

  return data || []
}

export async function createBooking(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: publicUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!publicUser) {
    throw new Error('User not found.')
  }

  const providerId = formData.get('providerId') as string
  const categoryId = formData.get('categoryId') as string
  const serviceAddress = formData.get('serviceAddress') as string
  const quotedRate = parseFloat(formData.get('quotedRate') as string)

  if (!providerId || !categoryId) {
    throw new Error('Provider and service category are required.')
  }

  const now = new Date()
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0')
  const bookingNumber = `TH-${dateStr}-${random}`

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      booking_number: bookingNumber,
      requester_id: publicUser.id,
      provider_id: providerId,
      category_id: categoryId,
      status: 'PENDING',
      service_address: serviceAddress?.trim() || null,
      quoted_rate: quotedRate || null,
      updated_at: new Date().toISOString(),
    })
    .select('id, booking_number')
    .single()

  if (error) {
    throw new Error(`Failed to create booking: ${error.message}`)
  }

  await supabase.from('booking_status_logs').insert({
    booking_id: booking.id,
    from_status: 'PENDING',
    to_status: 'PENDING',
    changed_by: publicUser.id,
    notes: 'Booking created',
  })

  redirect('/bookings')
}

export async function getMyBookings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: publicUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!publicUser) return { asRequester: [], asProvider: [] }

  const { data: asRequester } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_number,
      status,
      quoted_rate,
      service_address,
      requester_notes,
      created_at,
      provider:provider_profiles!bookings_provider_id_fkey(display_name),
      category:service_categories!bookings_category_id_fkey(name, icon_name)
    `)
    .eq('requester_id', publicUser.id)
    .order('created_at', { ascending: false })

  const { data: providerProfile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', publicUser.id)
    .is('deleted_at', null)
    .single()

  let asProvider: any[] = []
  if (providerProfile) {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        status,
        quoted_rate,
        service_address,
        requester_notes,
        created_at,
        requester:users!bookings_requester_id_fkey(full_name, phone),
        category:service_categories!bookings_category_id_fkey(name, icon_name)
      `)
      .eq('provider_id', providerProfile.id)
      .order('created_at', { ascending: false })

    asProvider = data || []
  }

  return { asRequester: asRequester || [], asProvider }
}

export async function getMyProviderProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: publicUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!publicUser) return null

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select(`
      id,
      display_name,
      bio,
      base_rate,
      rating_avg,
      rating_count,
      is_available,
      is_verified,
      services:provider_services(
        id,
        custom_rate,
        rate_type,
        description,
        is_active,
        category:service_categories(name, slug, icon_name)
      ),
      areas:service_areas(area_name, city)
    `)
    .eq('user_id', publicUser.id)
    .is('deleted_at', null)
    .single()

  return profile
}
