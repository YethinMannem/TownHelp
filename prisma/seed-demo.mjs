/**
 * Demo data seed — 15 realistic providers across Hyderabad neighborhoods.
 * Run: node prisma/seed-demo.mjs
 * Safe to re-run (uses ON CONFLICT DO NOTHING on user IDs).
 */
import 'dotenv/config'
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

// ─── Category IDs (fetch live so we don't hardcode) ───────────────────────────
const { rows: cats } = await client.query(
  `SELECT id, slug FROM service_categories WHERE is_active = true`
)
const cat = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

const MAID    = cat['maid']
const COOK    = cat['cook']
const ELEC    = cat['electrician']
const DHOBI   = cat['dhobi']
const TUTOR   = cat['tutor']
const PICKUP  = cat['pickup-drop']

// ─── Hyderabad neighborhoods (lat, lng) ───────────────────────────────────────
const AREAS = {
  madhapur:     { lat: 17.4401, lng: 78.3489, label: 'Madhapur' },
  gachibowli:   { lat: 17.4400, lng: 78.3489, label: 'Gachibowli' },
  hitec:        { lat: 17.4435, lng: 78.3772, label: 'HITEC City' },
  kondapur:     { lat: 17.4601, lng: 78.3489, label: 'Kondapur' },
  banjarahills: { lat: 17.4156, lng: 78.4458, label: 'Banjara Hills' },
  jubileehills: { lat: 17.4326, lng: 78.4071, label: 'Jubilee Hills' },
  kukatpally:   { lat: 17.4849, lng: 78.3988, label: 'Kukatpally' },
  miyapur:      { lat: 17.4948, lng: 78.3610, label: 'Miyapur' },
  begumpet:     { lat: 17.4417, lng: 78.4683, label: 'Begumpet' },
  ameerpet:     { lat: 17.4373, lng: 78.4483, label: 'Ameerpet' },
  secunderabad: { lat: 17.4399, lng: 78.4983, label: 'Secunderabad' },
  lb_nagar:     { lat: 17.3470, lng: 78.5512, label: 'LB Nagar' },
}

// ─── Provider definitions ─────────────────────────────────────────────────────
const providers = [
  {
    name: 'Lakshmi Devi',
    email: 'lakshmi.demo@townhelp.in',
    area: AREAS.madhapur,
    radius: 5,
    services: [
      { catId: MAID, rate: 400, rateType: 'PER_VISIT', desc: 'Full home cleaning, 2BHK & 3BHK specialist' },
      { catId: DHOBI, rate: 20, rateType: 'PER_KG', desc: 'Wash & iron, same-day delivery available' },
    ],
    rating: 4.8, reviews: 34, completed: 34, isVerified: true,
    bio: '8 years experience in home cleaning across Madhapur. Known for thorough bathroom and kitchen cleaning.',
    schedule: [1,2,3,4,5], hours: ['07:00', '17:00'], // Mon-Fri
  },
  {
    name: 'Ravi Kumar',
    email: 'ravi.demo@townhelp.in',
    area: AREAS.gachibowli,
    radius: 7,
    services: [
      { catId: COOK, rate: 600, rateType: 'PER_VISIT', desc: 'South Indian & North Indian cuisine, vegetarian specialist' },
    ],
    rating: 4.9, reviews: 52, completed: 52, isVerified: true,
    bio: 'Former hotel cook, now serving home kitchens. Specialises in healthy South Indian breakfasts and lunch boxes.',
    schedule: [1,2,3,4,5,6], hours: ['06:00', '11:00'],
  },
  {
    name: 'Mohammed Saleem',
    email: 'saleem.demo@townhelp.in',
    area: AREAS.hitec,
    radius: 10,
    services: [
      { catId: ELEC, rate: 300, rateType: 'PER_VISIT', desc: 'Wiring, switchboard repairs, fan installation, inverter setup' },
    ],
    rating: 4.7, reviews: 88, completed: 88, isVerified: true,
    bio: 'Licensed electrician with 12 years experience. Handles everything from fan fitting to full flat wiring.',
    schedule: [1,2,3,4,5,6,0], hours: ['09:00', '19:00'],
  },
  {
    name: 'Sunita Sharma',
    email: 'sunita.demo@townhelp.in',
    area: AREAS.kondapur,
    radius: 5,
    services: [
      { catId: MAID, rate: 350, rateType: 'PER_VISIT', desc: 'Cleaning, utensil washing, daily housekeeping' },
      { catId: COOK, rate: 500, rateType: 'PER_VISIT', desc: 'Rajasthani and North Indian cooking' },
    ],
    rating: 4.6, reviews: 21, completed: 21, isVerified: false,
    bio: 'Reliable and punctual. Available for morning slots. 5+ years serving apartments in Kondapur.',
    schedule: [1,2,3,4,5], hours: ['07:00', '13:00'],
  },
  {
    name: 'Anand Reddy',
    email: 'anand.demo@townhelp.in',
    area: AREAS.banjarahills,
    radius: 8,
    services: [
      { catId: PICKUP, rate: 150, rateType: 'PER_VISIT', desc: 'School pickup/drop, grocery runs, airport drops' },
    ],
    rating: 4.5, reviews: 63, completed: 63, isVerified: true,
    bio: 'Own Maruti Swift. Safe, on-time driver. School pickup specialist for Banjara Hills and Jubilee Hills.',
    schedule: [1,2,3,4,5,6,0], hours: ['06:00', '21:00'],
  },
  {
    name: 'Priya Menon',
    email: 'priya.demo@townhelp.in',
    area: AREAS.jubileehills,
    radius: 6,
    services: [
      { catId: TUTOR, rate: 500, rateType: 'HOURLY', desc: 'Maths and Science up to Class 10, CBSE & ICSE' },
    ],
    rating: 4.9, reviews: 29, completed: 29, isVerified: true,
    bio: 'B.Ed graduate, 6 years teaching experience. Results-oriented coaching for Class 6-10 students.',
    schedule: [1,2,3,4,5,6], hours: ['15:00', '20:00'],
  },
  {
    name: 'Venkat Naidu',
    email: 'venkat.demo@townhelp.in',
    area: AREAS.kukatpally,
    radius: 7,
    services: [
      { catId: ELEC, rate: 250, rateType: 'PER_VISIT', desc: 'Plumbing repairs, tap fixing, pipe leaks, water heater installation' },
      { catId: MAID, rate: 300, rateType: 'PER_VISIT', desc: 'Deep cleaning, post-renovation cleanup' },
    ],
    rating: 4.3, reviews: 15, completed: 15, isVerified: false,
    bio: 'Plumber and handyman. Quick response, reasonable rates. Serving Kukatpally Housing Board area.',
    schedule: [1,2,3,4,5,6], hours: ['08:00', '18:00'],
  },
  {
    name: 'Fatima Begum',
    email: 'fatima.demo@townhelp.in',
    area: AREAS.miyapur,
    radius: 5,
    services: [
      { catId: COOK, rate: 450, rateType: 'PER_VISIT', desc: 'Hyderabadi biryani, haleem, and daily meals' },
      { catId: MAID, rate: 380, rateType: 'PER_VISIT', desc: 'Cleaning and housekeeping' },
    ],
    rating: 4.7, reviews: 41, completed: 41, isVerified: true,
    bio: 'Known for authentic Hyderabadi cooking. Available for events and daily meal service.',
    schedule: [0,1,2,3,4,5,6], hours: ['06:30', '14:00'],
  },
  {
    name: 'Suresh Babu',
    email: 'suresh.demo@townhelp.in',
    area: AREAS.begumpet,
    radius: 8,
    services: [
      { catId: DHOBI, rate: 25, rateType: 'PER_KG', desc: 'Wash, dry, fold. Premium ironing service for formals.' },
    ],
    rating: 4.4, reviews: 77, completed: 77, isVerified: true,
    bio: 'Running a laundry business for 10 years. Pickup and delivery within 24 hours.',
    schedule: [1,2,3,4,5,6], hours: ['08:00', '20:00'],
  },
  {
    name: 'Kavitha Rao',
    email: 'kavitha.demo@townhelp.in',
    area: AREAS.ameerpet,
    radius: 5,
    services: [
      { catId: TUTOR, rate: 400, rateType: 'HOURLY', desc: 'Telugu medium tuition, English speaking classes' },
      { catId: MAID, rate: 320, rateType: 'PER_VISIT', desc: 'Part-time housekeeping' },
    ],
    rating: 4.2, reviews: 11, completed: 11, isVerified: false,
    bio: 'Graduate teacher. Gives spoken English and academic coaching in the evenings.',
    schedule: [1,2,3,4,5], hours: ['16:00', '20:00'],
  },
  {
    name: 'Ramesh Goud',
    email: 'ramesh.demo@townhelp.in',
    area: AREAS.secunderabad,
    radius: 10,
    services: [
      { catId: PICKUP, rate: 120, rateType: 'PER_VISIT', desc: 'Auto rickshaw - school runs, market trips, short distances' },
    ],
    rating: 4.6, reviews: 112, completed: 112, isVerified: true,
    bio: 'CNG auto, clean and comfortable. 15 years on road. Fixed rates, no meter haggling.',
    schedule: [1,2,3,4,5,6,0], hours: ['05:30', '22:00'],
  },
  {
    name: 'Deepa Krishnamurthy',
    email: 'deepa.demo@townhelp.in',
    area: AREAS.lb_nagar,
    radius: 6,
    services: [
      { catId: COOK, rate: 550, rateType: 'PER_VISIT', desc: 'Tamil and Andhra cuisine, tiffin boxes for office' },
      { catId: TUTOR, rate: 350, rateType: 'HOURLY', desc: 'Primary school help, Class 1-5' },
    ],
    rating: 4.8, reviews: 38, completed: 38, isVerified: true,
    bio: 'Home cook and part-time tutor. Trusted by 30+ families in LB Nagar for daily tiffin delivery.',
    schedule: [1,2,3,4,5,6], hours: ['07:00', '12:00'],
  },
  {
    name: 'Amar Singh',
    email: 'amar.demo@townhelp.in',
    area: AREAS.hitec,
    radius: 12,
    services: [
      { catId: ELEC, rate: 350, rateType: 'PER_VISIT', desc: 'AC installation, servicing, gas refilling' },
    ],
    rating: 4.5, reviews: 56, completed: 56, isVerified: true,
    bio: 'AC mechanic with Daikin and Voltas certifications. Quick turnaround, all brands serviced.',
    schedule: [1,2,3,4,5,6], hours: ['09:00', '18:00'],
  },
  {
    name: 'Meena Pillai',
    email: 'meena.demo@townhelp.in',
    area: AREAS.kondapur,
    radius: 5,
    services: [
      { catId: MAID, rate: 420, rateType: 'PER_VISIT', desc: 'Premium apartment cleaning, balcony, windows' },
    ],
    rating: 4.9, reviews: 67, completed: 67, isVerified: true,
    bio: 'Specialises in premium flat cleaning. Brings own supplies. Trusted by several IT families in Kondapur.',
    schedule: [1,2,3,4,5,6], hours: ['08:00', '16:00'],
  },
  {
    name: 'Vijay Tiwari',
    email: 'vijay.demo@townhelp.in',
    area: AREAS.madhapur,
    radius: 8,
    services: [
      { catId: PICKUP, rate: 200, rateType: 'PER_VISIT', desc: 'Bike delivery / errands – groceries, medicines, documents' },
      { catId: TUTOR, rate: 450, rateType: 'HOURLY', desc: 'JEE / NEET foundation, Physics and Maths' },
    ],
    rating: 4.4, reviews: 23, completed: 23, isVerified: false,
    bio: 'Engineering grad. Does bike errands and tutors JEE students on weekends.',
    schedule: [6,0], hours: ['10:00', '18:00'], // weekends only
  },
]

// ─── Insert helpers ───────────────────────────────────────────────────────────

async function upsertUser(p) {
  const { rows } = await client.query(
    `INSERT INTO users (id, full_name, email, auth_provider, is_email_verified, is_active, updated_at)
     VALUES (gen_random_uuid(), $1, $2, 'EMAIL', true, true, NOW())
     ON CONFLICT (email) DO UPDATE SET full_name = $1
     RETURNING id`,
    [p.name, p.email]
  )
  return rows[0].id
}

async function upsertProvider(userId, p) {
  const { rows } = await client.query(
    `INSERT INTO provider_profiles
       (id, user_id, display_name, bio, base_rate, is_available, is_verified, is_background_checked,
        rating_avg, rating_count, rating_sum, completed_bookings,
        latitude, longitude, max_travel_radius_km, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, true, $5, $6,
             $7, $8, $9, $10,
             $11, $12, $13, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET display_name=$2, bio=$3, base_rate=$4, is_verified=$5, is_background_checked=$6,
           rating_avg=$7, rating_count=$8, rating_sum=$9, completed_bookings=$10,
           latitude=$11, longitude=$12, max_travel_radius_km=$13, updated_at=NOW()
     RETURNING id`,
    [
      userId, p.name, p.bio,
      p.services[0].rate,
      p.isVerified, p.isVerified,
      p.rating, p.reviews, Math.round(p.rating * p.reviews), p.completed,
      p.area.lat, p.area.lng, p.radius,
    ]
  )
  return rows[0].id
}

async function upsertServiceArea(providerId, area, radius) {
  await client.query(
    `INSERT INTO service_areas
       (id, provider_id, area_name, city, state, latitude, longitude, radius_km, is_primary)
     VALUES (gen_random_uuid(), $1, $2, 'Hyderabad', 'Telangana', $3, $4, $5, true)
     ON CONFLICT DO NOTHING`,
    [providerId, area.label, area.lat, area.lng, radius]
  )
}

async function upsertServices(providerId, services) {
  for (const svc of services) {
    await client.query(
      `INSERT INTO provider_services
         (id, provider_id, category_id, custom_rate, rate_type, description, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
       ON CONFLICT (provider_id, category_id) DO UPDATE
         SET custom_rate=$3, rate_type=$4, description=$5, is_active=true, updated_at=NOW()`,
      [providerId, svc.catId, svc.rate, svc.rateType, svc.desc]
    )
  }
}

async function upsertAvailability(providerId, days, hours) {
  const startTime = `${hours[0]}:00`
  const endTime   = `${hours[1]}:00`

  // Remove existing slots then reinsert (cleaner than upsert on composite key)
  await client.query(`DELETE FROM provider_availabilities WHERE provider_id = $1`, [providerId])

  for (const day of days) {
    await client.query(
      `INSERT INTO provider_availabilities
         (id, provider_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())`,
      [providerId, day, startTime, endTime]
    )
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('Seeding demo providers...\n')

for (const p of providers) {
  try {
    const userId = await upsertUser(p)
    const providerId = await upsertProvider(userId, p)
    await upsertServiceArea(providerId, p.area, p.radius)
    await upsertServices(providerId, p.services)
    await upsertAvailability(providerId, p.schedule, p.hours)
    console.log(`  ✓ ${p.name} (${p.area.label})`)
  } catch (err) {
    console.error(`  ✗ ${p.name}:`, err.message)
  }
}

console.log(`\nDone — ${providers.length} providers seeded.`)
await client.end()
