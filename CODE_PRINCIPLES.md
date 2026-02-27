# Code Principles

Rules for writing and reviewing code in this project. Hard rules are non-negotiable; soft guidelines use judgment.

## Hard Rules

### 1. Single Responsibility (SRP)
Every function, component, and module does one thing. If you need "and" to describe it, split it.

### 2. No Magic Values
All literals that aren't self-evident (0, 1, true, false, '') must be named constants.
```tsx
// Bad
if (timers.length >= 8) { ... }

// Good
const MAX_TIMERS = 8;
if (timers.length >= MAX_TIMERS) { ... }
```

### 3. Descriptive Names
Names reveal intent. No abbreviations, no generic names (data, info, item, temp, result) in scopes longer than 3 lines. Use PascalCase for components, camelCase for functions/variables.
```tsx
// Bad
const d = markers.filter(m => m.type === 'boss');

// Good
const bossMarkers = markers.filter(marker => marker.type === 'boss');
```

### 4. Error Handling at Boundaries
All async operations, API calls, database queries, and external integrations must have error handling. Internal pure functions trust their inputs.

### 5. Max 40 Lines Per Function
If a function exceeds 40 lines, extract sub-operations. React components: JSX return doesn't count toward the limit, but logic before the return does.

### 6. Max 3 Parameters
Functions with more than 3 parameters must use an options object.
```tsx
// Bad
function createTimer(name: string, duration: number, sound: string, color: string) {}

// Good
function createTimer(options: TimerOptions) {}
```

### 7. Max 3 Levels of Nesting
Use early returns, guard clauses, or extraction to avoid deep nesting.

### 8. No Duplicated Logic
If the same logic appears in 2+ places, extract it. Shared UI goes in `components/`, shared utilities in `lib/`.

### 9. YAGNI
Only build what the current task requires. No speculative abstractions, no "might need this later."

### 10. Law of Demeter
Talk to direct collaborators only. Don't chain through objects: `store.getState().timers[0].settings.sound` — expose a focused selector instead.

### 11. AAA Tests
Tests follow Arrange-Act-Assert. One behavior per test. Test names describe expected behavior.

## Soft Guidelines

### 1. KISS
Pick the simplest solution that works. Three similar lines are better than a premature abstraction.

### 2. Deep Modules
Prefer simple interfaces that hide complex implementations. A Zustand store should expose focused actions, not raw state manipulation.

### 3. Composition Over Inheritance
Combine components and hooks. Don't create base classes or extend hierarchies.

### 4. Strategic Programming
Spend time on good design upfront. Tactical "just make it work" leads to complexity debt.

### 5. Comments Explain WHY
Code should be self-documenting for the "what." Comments explain non-obvious reasoning, business rules, or workarounds.

### 6. Colocation
Keep related code together. Feature-specific components live with their feature in `app/features/<name>/`, not in the shared `components/` directory.

### 7. Consistent Patterns
Follow existing patterns in the codebase. If Zustand stores use a specific shape, match it. If components follow a structure, replicate it.

### 8. Minimal Component Props
Components should have a small, focused API surface. Prefer composition (children, slots) over extensive prop lists.

## Project Exceptions

- **Route directory naming**: Uses snake_case (`runes_dreaming`, `gearscore_cal`) for URL-friendliness, not camelCase.
- **No test framework yet**: Rule 11 (AAA Tests) applies once vitest is added. Until then, manual testing is acceptable.
- **Dark mode only**: No light mode support needed. `forcedTheme="dark"` is intentional.
- **Mixed semicolons**: No enforced formatter — existing code has inconsistent semicolons. New code should be consistent within its file.
