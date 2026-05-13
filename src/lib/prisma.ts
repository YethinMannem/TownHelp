import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const adapter = new PrismaPg({
    connectionString,
    ...(isProduction && { ssl: { rejectUnauthorized: false } }),
    // pgBouncer transaction mode (port 6543) requires statement_cache_size=0
    ...(isProduction && { statement_cache_size: 0 }),
  })
  return new PrismaClient({ adapter })
}

function getClient(): PrismaClient {
  return globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient())
}

// Lazy proxy — client is created on first property access, not at module load.
// This prevents build-time failures when DATABASE_URL is absent during
// static page generation (e.g. /_not-found collects config without a DB).
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop as string | symbol)
  },
})
