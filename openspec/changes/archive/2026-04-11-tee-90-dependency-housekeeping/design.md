## Context

The project has 11 individual `@radix-ui/react-*` packages that can be consolidated into a single `radix-ui` mono package. The `tailwindcss-animate` plugin is abandoned and loaded via legacy `tailwind.config.ts`, while its replacement `tw-animate-css` is already installed but not imported. The `dancing-links` package is at v2.1.1 (current: v4.3.7) with a complete API rewrite from standalone functions to a class-based solver interface.

**Current state:**
- Tailwind v4 with CSS-first config (`globals.css`), but legacy `tailwind.config.ts` still exists with theme + plugin config
- `dancing-links` v2 API: `findAll(constraints)` with `SimpleConstraint<T>` / `Constraint<T>` types
- `dancing-links` v4 API: `new DancingLinks<T>()` → `createSolver({ columns })` → `addBinaryConstraint(data, row)` → `solver.findAll()`

## Goals / Non-Goals

**Goals:**
- Consolidate Radix UI packages into unified mono package
- Replace abandoned `tailwindcss-animate` with already-installed `tw-animate-css`
- Upgrade `dancing-links` to v4, adapting solver code to new class-based API
- Maintain identical runtime behavior for all features (no visual regressions, no solver behavior changes)

**Non-Goals:**
- Full Tailwind v4 migration (removing `tailwind.config.ts` entirely) — out of scope, only the animate plugin swap
- Refactoring ShapeDoctor solver logic — only adapting to new API surface
- Migrating from Radix to Base UI — only consolidating Radix packages

## Decisions

### D1: Use `npx shadcn@latest migrate radix` for Radix migration

**Rationale:** shadcn provides an official migration tool that handles import rewrites across all component files. Manual find-and-replace is error-prone across 14 files with varying import patterns.

**Alternative considered:** Manual search-and-replace of `@radix-ui/react-*` imports → `radix-ui`. Rejected because the shadcn tool also handles package.json cleanup and edge cases.

### D2: Add CSS import for tw-animate-css, remove plugin from config

**Approach:**
1. Add `@import "tw-animate-css";` to `globals.css` (after `@import "tailwindcss"`)
2. Remove `plugins: [require("tailwindcss-animate")]` from `tailwind.config.ts`
3. Remove `tailwindcss-animate` from devDependencies
4. Keep accordion keyframes in `tailwind.config.ts` — they reference Radix CSS variables (`--radix-accordion-content-height`) and removing them risks breaking the accordion component

**Alternative considered:** Also migrate all theme config from `tailwind.config.ts` to CSS `@theme` directives. Rejected — that's a separate Tailwind v4 migration effort beyond this ticket's scope.

### D3: Adapt solver.dlx.ts to dancing-links v4 class-based API

**Approach:** The solver has two functions that call the dancing-links API:
1. `findExactKTilingSolutions` — uses `SimpleConstraint<PlacementRecord>` (primary-only constraints) → `findAll(constraints)`
2. `findMaximalPlacement` — uses `Constraint<PlacementRecord>` (primary + secondary) → `findAll(constraints)`

For v4 migration:
- Replace standalone `findAll()` import with `DancingLinks` class import
- In each function, create a `DancingLinks` instance, then `createSolver({ columns })` or `createSolver({ primaryColumns, secondaryColumns })`
- Convert constraint arrays to `addBinaryConstraint(data, row)` calls
- Call `solver.findAll()` instead of standalone `findAll(constraints)`
- Result type changes from `Result<T>` to `{ data: T, index: number }`

**Module depth:** The solver module's public interface (`findExactKTilingSolutions`, `findMaximalPlacement`) stays unchanged — only internal implementation adapts to the new library API. Callers see no difference.

**Information hiding:** The `buildDancingLinksConstraints` helper stays internal. The dancing-links version/API is fully encapsulated within `solver.dlx.ts`.

**Alternative considered:** Remove `dancing-links` entirely and implement DLX from scratch. Rejected — the library is actively maintained, performant (fastest JS DLX implementation per benchmarks), and the upgrade path is straightforward.

## Risks / Trade-offs

- **[Risk] dancing-links v4 API behavior differences** → Mitigation: The solver has debug logging (`ENABLE_DLX_DEBUG_LOGGING`). Run ShapeDoctor in browser after upgrade and verify solutions match. The library is a well-tested exact cover solver — algorithmic behavior should be identical.
- **[Risk] tw-animate-css not 100% compatible drop-in** → Mitigation: The npm page notes "might not be a 100% compatible drop-in replacement." Verify animation classes used in codebase (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) all work. These are the core utilities that tw-animate-css explicitly supports.
- **[Risk] shadcn migrate tool may not handle Map/Sidebar.tsx** → Mitigation: The migration tool targets shadcn components. `Map/Sidebar.tsx` imports Radix directly — check if the tool handles it, fix manually if not.
