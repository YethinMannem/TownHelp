'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProviderProfile(formData: FormData) {
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
    throw new Error('User profile not found. Please sign out and sign in again.')
  }

  const { data: existingProfile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', publicUser.id)
    .is('deleted_at', null)
    .single()

  if (existingProfile) {
    redirect('/provider/dashboard')
  }

  const displayName = formData.get('displayName') as string
  const baseRate = parseFloat(formData.get('baseRate') as string)
  const bio = formData.get('bio') as string
  const areaName = formData.get('areaName') as string

  if (!displayName || !baseRate) {
    throw new Error('Display name and base rate are required.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('provider_profiles')
    .insert({
      user_id: publicUser.id,
      display_name: displayName.trim(),
      base_rate: baseRate,
      bio: bio?.trim() || null,
      is_available: true,
      is_verified: false,
      rating_avg: 0,
      rating_count: 0,
      rating_sum: 0,
      completed_bookings: 0,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`)
  }

  if (areaName?.trim()) {
    await supabase.from('service_areas').insert({
      provider_id: profile.id,
      area_name: areaName.trim(),
      city: 'Hyderabad',
      state: 'Telangana',
      is_primary: true,
    })
  }

  redirect('/provider/add-service')
}

export async function addProviderService(formData: FormData) {
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

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', publicUser.id)
    .is('deleted_at', null)
    .single()

  if (!profile) {
    redirect('/provider/register')
  }

  const categoryId = formData.get('categoryId') as string
  const customRate = parseFloat(formData.get('customRate') as string)
  const rateType = formData.get('rateType') as string
  const description = formData.get('description') as string

  if (!categoryId) {
    throw new Error('Please select a service category.')
  }

  const { error } = await supabase.from('provider_services').insert({
    provider_id: profile.id,
    category_id: categoryId,
    custom_rate: customRate || null,
    rate_type: rateType || 'HOURLY',
    description: description?.trim() || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('You already offer this service. Go to your dashboard to edit it.')
    }
    throw new Error(`Failed to add service: ${error.message}`)
  }

  redirect('/provider/dashboard')
}
