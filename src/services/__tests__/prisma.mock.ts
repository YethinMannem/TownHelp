import { vi, beforeEach } from 'vitest'

// Deep mock of PrismaClient for unit tests.
// Each model gets jest-style mock functions for common operations.

function createModelMock() {
  return {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  }
}

export type ModelMock = ReturnType<typeof createModelMock>

function createPrismaMock() {
  return {
    booking: createModelMock(),
    bookingStatusLog: createModelMock(),
    user: createModelMock(),
    providerProfile: createModelMock(),
    providerService: createModelMock(),
    serviceCategory: createModelMock(),
    serviceArea: createModelMock(),
    review: createModelMock(),
    conversation: createModelMock(),
    message: createModelMock(),
    notification: createModelMock(),
    favorite: createModelMock(),
    payment: createModelMock(),
    $transaction: vi.fn(),
  }
}

export type PrismaMock = ReturnType<typeof createPrismaMock>

export const prismaMock = createPrismaMock()

/**
 * Creates a separate tx mock for $transaction callbacks.
 * This ensures tests verify that service code uses `tx` (the
 * transactional client) instead of `prisma` (the outer client).
 *
 * Usage:
 *   const tx = mockTransaction()
 *   tx.booking.updateMany.mockResolvedValue({ count: 1 })
 *   // assertions on tx, not prismaMock
 */
export function mockTransaction(): PrismaMock {
  const tx = createPrismaMock()
  prismaMock.$transaction.mockImplementation(
    async (cb: (txClient: PrismaMock) => Promise<unknown>) => cb(tx)
  )
  return tx
}

// Mock the prisma import so services use our mock
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function resetMock(mock: PrismaMock) {
  Object.values(mock).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          (fn as ReturnType<typeof vi.fn>).mockReset()
        }
      })
    } else if (typeof model === 'function' && 'mockReset' in model) {
      (model as ReturnType<typeof vi.fn>).mockReset()
    }
  })
}

// Reset all mocks between tests
beforeEach(() => {
  resetMock(prismaMock)
})
