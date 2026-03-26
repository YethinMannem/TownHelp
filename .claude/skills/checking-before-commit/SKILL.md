---
name: checking-before-commit
description: >
  Runs quality checks, feature verification, and security scans before
  committing TownHelp code. Activates when preparing to commit, push,
  verifying a feature works, or when quality verification is needed.
  Triggers on "commit", "push", "ready to commit", "quality check", "test", "verify".
allowed-tools: Bash, Read, Grep, Glob
---

# Pre-commit quality gate

## Step 1: Automated checks

Run these in order. Stop and fix on first failure.

```bash
# Type safety
npx tsc --noEmit

# Schema integrity (if prisma/schema.prisma was modified)
npx prisma validate

# Lint
npx next lint

# Build
npm run build
```

## Step 2: Security scan

Scan staged files for leaked secrets or unsafe patterns:

```bash
# Must return empty — if not, remove the secret before committing
git diff --staged | grep -iE "(password|secret|key|token|supabase_service_role)"

# No .env files staged
git diff --staged --name-only | grep -E "\.env"
```

Also check for:
- Hardcoded URLs (should use env vars)
- Missing auth checks in new API routes
- `console.log` left in production code (use `console.error` for real errors only)

## Step 3: Feature verification

For each feature touched, verify:

- **Happy path** — does the core flow work?
- **Error states** — network failure, invalid input, unauthorized access handled?
- **Empty states** — what does the user see with no data?
- **Auth guard** — unauthenticated users redirect to `/login`?
- **Mobile** — does it look right on a 375px viewport?

## Step 4: Final review

```bash
# Review what's being committed
git diff --staged

# Verify no unintended files
git status
```

## Step 5: Commit

Format: `type(scope): imperative description` (max 72 chars)

## Output format

After running all checks, report:

```
## Quality Report
### Passed
- [list of checks that passed]
### Failed
- [list with details and fix needed]
### Feature Verification
- [happy path, error states, empty states, auth, mobile]
### Recommendation: Ship / Fix first / Needs more testing
```

Quality over speed. If anything fails, fix before proceeding.
