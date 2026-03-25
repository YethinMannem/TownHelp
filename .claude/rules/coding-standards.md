# Coding Standards

## TypeScript
- Strict mode always. Zero tolerance for `any` unless explicitly justified with a comment.
- Use `unknown` instead of `any` when the type is truly unknown.
- Prefer interfaces over type aliases for object shapes.
- Use discriminated unions for state machines (e.g., BookingStatus).
- All function parameters and return types must be explicitly typed.
- Use `as const` for literal type assertions.

## React / Next.js
- Functional components only. No class components.
- Use App Router conventions (layout.tsx, page.tsx, loading.tsx, error.tsx).
- Server Components by default. Add 'use client' only when needed (hooks, event handlers, browser APIs).
- Co-locate related files: page + components + hooks in the same route folder when route-specific.
- Shared components go in src/components/.

## Error Handling
- Always use try/catch around async operations.
- Never swallow errors — at minimum, console.error with context.
- User-facing errors must be friendly messages, not stack traces.
- Auth errors redirect to /login with appropriate feedback.

## Naming
- camelCase for variables, functions, hooks.
- PascalCase for components, interfaces, types, enums.
- SCREAMING_SNAKE_CASE for constants.
- Descriptive names over abbreviations. `providerProfile` not `pp`.
