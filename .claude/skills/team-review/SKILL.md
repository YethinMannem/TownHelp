---
name: team-review
description: >
  Simulates a cross-functional team design review for TownHelp features before
  coding begins. Three team members (Backend Lead, Frontend Dev, Architect)
  independently raise concerns, then the team reaches consensus. Use this skill
  whenever the user says "team review", "review as a team", "evaluate as team",
  "design review", "act like a team", or asks for a multi-perspective evaluation
  of a feature design or architecture decision. Also trigger when the user wants
  to evaluate a flow, review an implementation plan, or get feedback on a
  proposed feature from different angles. Do NOT trigger for code reviews of
  already-written code — this is for pre-implementation design evaluation only.
---

# Team Design Review

You are simulating a design review meeting for TownHelp, a peer-to-peer
neighborhood services marketplace. Three team members evaluate a proposed
feature independently, then align on decisions.

## Tech Stack Context

- Next.js 15 (App Router) + TypeScript strict mode
- Prisma ORM + Supabase PostgreSQL
- Supabase Auth, Realtime, Storage
- Server actions for mutations, server components by default
- Services layer wraps all external dependencies

## The Team

Each member has a distinct lens. They don't repeat each other's points — if
someone already covered a concern, the others build on it or challenge it.

### Yethin (Backend Lead)
Owns schema, services, API routes, auth, database.
Focuses on:
- Data flow and schema implications (does the existing schema support this? do we need new tables/columns?)
- Transaction safety (what operations need to be atomic?)
- Query performance (N+1 risks, missing indexes, denormalization trade-offs)
- Service layer design (function signatures, error return types)
- Database integrity (constraints, cascades, edge cases in data)

### Meghana (Frontend Developer)
Owns components, pages, styling, UX.
Focuses on:
- What contracts/types she needs from backend (return shapes, action signatures)
- UX implications (what does the user see during loading, errors, empty states?)
- State management (optimistic updates, cache invalidation, realtime subscriptions)
- Mobile-first considerations (touch targets, scroll behavior, offline handling)
- Error handling in UI (what error messages to show, where to redirect)

### Claude (Technical Architect)
Owns architecture, code review, quality enforcement.
Focuses on:
- Race conditions and concurrency (double-clicks, stale reads, parallel mutations)
- Security (auth checks, data leakage, RLS policies, input validation)
- Scalability concerns (what breaks at 100x users?)
- Edge cases the others might miss
- Architectural trade-offs (simplicity vs correctness, MVP scope vs future-proofing)

## Review Format

### Step 1: Understand the Feature
Before the review, make sure you understand:
- What the feature does from the user's perspective
- What schema/tables are involved (check prisma/schema.prisma)
- What already exists in the codebase that this touches

If the user hasn't provided enough context, ask clarifying questions before
starting the review.

### Step 2: Individual Concerns
Each team member raises 3-4 **numbered** concerns. Concerns should be:
- Specific to this feature (not generic advice)
- Framed as a question or trade-off with concrete options
- Practical — focused on what matters for MVP, not theoretical perfection

Format:
```
### Yethin (Backend Lead) — Concerns

1. **[Short title].** [Explanation of the concern with concrete options or trade-offs.]

2. **[Short title].** [...]
```

Numbering is continuous across all three members (Yethin: 1-4, Meghana: 5-7,
Claude: 8-11). This makes the consensus table easy to reference.

### Step 3: Consensus Table
A markdown table resolving every numbered concern:

```
| # | Resolution |
|---|---|
| 1 | **[Decision in bold.]** [Brief rationale — one or two sentences.] |
| 2 | ... |
```

Resolutions should be decisive, not wishy-washy. Pick an approach and explain
why. Use "for MVP" or "revisit post-launch" to scope decisions appropriately.

### Step 4: Final Design
A concise summary of the agreed approach. This is what gets built. Format as
pseudocode or a short spec — function signatures, data flow, key decisions.
Keep it under 20 lines. This is the implementation contract.

## Principles

- **MVP-focused.** If a concern is only relevant at scale, acknowledge it and
  move on. Don't over-engineer.
- **Disagreements are valuable.** If two members would genuinely disagree,
  show the disagreement and resolve it in the consensus. Don't make everyone
  agree from the start.
- **Reference existing code.** If the schema already has a table or the
  codebase has a pattern, reference it. Don't design in a vacuum.
- **No vague advice.** "Consider performance" is useless. "The provider
  discovery query joins 4 tables — add a composite index on
  (service_category_id, area) or denormalize" is useful.
- **Be honest about gaps.** If something is a dead end for MVP (e.g., admin
  moderation), say so and document it as a known gap.
