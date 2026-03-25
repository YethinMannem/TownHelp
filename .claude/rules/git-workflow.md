# Git Workflow

## Before Every Commit
1. Run `git status` — no .env, no node_modules, no secrets.
2. Run `npm run build` or `npx tsc --noEmit` — no type errors.
3. Review the diff: `git diff --staged`.

## Commit Messages (Conventional Commits)
Format: `type(scope): imperative short description`

Types: feat, fix, chore, refactor, docs, test, style, perf
Scopes: db, auth, ui, api, config, deps

Subject: max 72 chars, imperative mood ("add" not "added" or "adds").
Body: separated by blank line, explain what and why, wrap at 72 chars.
No fake Reviewed-by or Co-authored-by trailers.

## Branching
- `main` is protected (after initial setup phase).
- Feature branches: `feat/provider-profiles`, `fix/auth-redirect`.
- PRs required for merge into main.
- Delete branches after merge.

## Examples
```
feat(auth): add email magic link authentication

Implement Supabase Auth with email OTP for development. Application-level
sync creates public.users records on first login. Production swap to
phone OTP requires only Supabase dashboard config change.
```

```
fix(db): correct typo in User model field name

Rename reportsFileld to reportsFiled in Prisma schema.
Regenerate client and apply migration.
```
