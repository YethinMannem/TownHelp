import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
