---
name: running-migrations
description: >
  Manages Prisma schema changes and database migrations for TownHelp.
  Activates when modifying tables, adding columns, creating models,
  running migrations, or seeding data. Triggers on "prisma", "migration",
  "schema", "model", "table", "column", "seed", "database change".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Migration workflow

```bash
# 1. Generate (creates SQL, does NOT apply)
npx prisma migrate dev --name descriptive-kebab-case --create-only

# 2. Review the SQL
cat prisma/migrations/*/migration.sql

# 3. Apply
npx prisma migrate dev

# 4. Regenerate client
npx prisma generate
```

## Schema conventions

- UUIDs: `id String @id @default(uuid())`
- Timestamps: `createdAt DateTime @default(now()) @map("created_at")`
- Map to snake_case: `@@map("table_name")`, `@map("column_name")`
- Money: `Decimal @db.Decimal(10, 2)`
- Ratings: `Decimal @db.Decimal(3, 2)`

## After migration

1. Verify in Supabase dashboard
2. Update `src/types/` if shared contracts changed
3. Update relevant `src/services/` files
4. Never edit existing migrations — always create new ones
