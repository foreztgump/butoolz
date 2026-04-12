## Why

Three dependency cleanup opportunities were identified during an audit: Radix UI has a unified package replacing 11 individual ones, `tailwindcss-animate` is abandoned and already superseded by `tw-animate-css` in our deps, and `dancing-links` is two major versions behind with a complete API rewrite. Cleaning these up reduces dependency count, removes abandoned packages, and keeps the solver current.

## What Changes

- **Radix UI consolidation**: Migrate 11 individual `@radix-ui/react-*` packages to the unified `radix-ui` mono package using `npx shadcn@latest migrate radix`. No breaking changes — pure package consolidation.
- **Remove `tailwindcss-animate`**: Remove the abandoned plugin from `tailwind.config.ts` and `devDependencies`. Add `@import "tw-animate-css"` to `globals.css` so existing animation classes (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) continue working via the already-installed replacement.
- **Upgrade `dancing-links` v2 → v4**: The package IS actively used in `app/shapedoctor/solver.dlx.ts` for both exact k-tiling and maximal placement. v4 has a class-based API (`DancingLinks` → `createSolver()` → `addBinaryConstraint()` → `solver.findAll()`). Requires rewriting constraint building and solver calls.

## Capabilities

### New Capabilities
_(none — this is dependency housekeeping, not new functionality)_

### Modified Capabilities
- `dep-upgrade`: Adding requirements for Radix unified package, tw-animate-css replacement, and dancing-links v4 upgrade.

## Impact

- **Dependencies**: Net reduction of ~10 packages (11 Radix individual → 1 unified, remove tailwindcss-animate). dancing-links upgrade is version-only.
- **Components**: All 13 shadcn/ui components using `@radix-ui/react-*` imports will be updated by the migration tool. `components/Map/Sidebar.tsx` also imports Radix directly.
- **CSS**: `tailwind.config.ts` plugin list changes. `globals.css` gains a new import.
- **ShapeDoctor solver**: `app/shapedoctor/solver.dlx.ts` (~390 lines) requires rewrite of constraint building and solver invocation to match dancing-links v4 API.
- **Rollback plan**: Each sub-task is independently revertable via `git revert`. If the Radix migration breaks components, revert and reinstall individual packages. If dancing-links v4 breaks the solver, pin back to v2.
