const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validates that a string is a properly formatted UUID v4.
 * Use in server actions to reject malformed IDs before they hit Prisma.
 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/**
 * Throws a descriptive error if the value is not a valid UUID.
 * Use at the top of server actions for required ID parameters.
 */
export function requireUUID(value: unknown, fieldName: string = 'ID'): string {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid ${fieldName} format.`)
  }
  return value
}
