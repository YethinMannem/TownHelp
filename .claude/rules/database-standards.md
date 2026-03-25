# Database Standards

## Prisma Schema
- All tables use UUIDs as primary keys (`@default(uuid())`).
- snake_case for database columns via `@@map` and `@map`.
- camelCase for TypeScript model fields.
- Every table has `createdAt DateTime @default(now())`.
- Mutable tables also have `updatedAt DateTime @updatedAt`.
- Soft deletes via `deletedAt DateTime?` on User and ProviderProfile.

## Data Integrity
- Decimal precision always specified: money = Decimal(10,2), ratings = Decimal(3,2).
- CHECK constraints for business rules (no self-reviews, rating 1-5, no self-booking).
- Foreign keys with appropriate cascade/restrict behavior.
- Unique constraints on natural keys (e.g., provider-service pairs).

## Performance
- Composite indexes on hot query paths.
- Partial indexes on soft-delete columns (WHERE deleted_at IS NULL).
- Index naming: `idx_{table}_{columns}`.

## Migrations
- Never edit existing migrations. Create new ones.
- Test migrations on a fresh database before pushing.
- Seed data goes in prisma/seed.mjs.
- Run `npx prisma generate` after any schema change.
