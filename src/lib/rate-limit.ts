/**
 * Simple in-memory sliding-window rate limiter.
 *
 * NOT suitable for multi-instance deployments — use Redis-backed
 * rate limiting (e.g., @upstash/ratelimit) when scaling horizontally.
 * Sufficient for single-instance MVP on Vercel.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup(): void {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      // Remove entries with no recent timestamps
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 60_000) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
  // Don't block process exit
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window size in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number | null
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Unique identifier (e.g., `userId:actionName`)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed
 *
 * @example
 * ```ts
 * const { allowed } = checkRateLimit(`${userId}:createBooking`, {
 *   maxRequests: 5,
 *   windowMs: 60_000, // 5 per minute
 * })
 * if (!allowed) {
 *   return { success: false, error: 'Too many requests. Please try again later.' }
 * }
 * ```
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup()

  const now = Date.now()
  const windowStart = now - config.windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = oldestInWindow + config.windowMs - now

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    }
  }

  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    retryAfterMs: null,
  }
}
