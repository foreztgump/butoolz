# Dependency Housekeeping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate 11 Radix UI packages into 1, replace abandoned tailwindcss-animate with tw-animate-css, and upgrade dancing-links from v2 to v4.

**Architecture:** Three independent dependency changes. Radix migration uses shadcn CLI tool. Animate swap is a CSS import change. Dancing-links upgrade requires rewriting solver.dlx.ts to use v4's class-based DancingLinks API (createSolver → addBinaryConstraint → findAll).

**Tech Stack:** Next.js 16, Tailwind CSS 4, shadcn/ui, dancing-links 4.3.7, webpack (worker build)

**Worktree:** `/home/cownose/projects/butoolz-tee-90-dependency-housekeeping`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Dependency changes (Radix consolidation, remove tailwindcss-animate, upgrade dancing-links) |
| `app/globals.css` | Modify | Add `@import "tw-animate-css"` |
| `tailwind.config.ts` | Modify | Remove `plugins: [require("tailwindcss-animate")]` |
| `app/shapedoctor/solver.dlx.ts` | Modify | Rewrite to dancing-links v4 class-based API |
| `components/ui/*.tsx` (13 files) | Modify (by shadcn CLI) | Radix import rewrites |
| `components/Map/Sidebar.tsx` | Modify (manual if CLI misses) | Fix `CheckedState` import from `@radix-ui/react-checkbox` |

---

### Task 1: Radix UI Unified Package Migration

**Files:**
- Modify: `package.json` (11 `@radix-ui/react-*` entries → 1 `radix-ui`)
- Modify: `components/ui/accordion.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/checkbox.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/label.tsx`, `components/ui/progress.tsx`, `components/ui/scroll-area.tsx`, `components/ui/select.tsx`, `components/ui/separator.tsx`, `components/ui/tabs.tsx`, `components/ui/tabs_old.tsx`, `components/ui/tooltip.tsx`
- Modify: `components/Map/Sidebar.tsx` (imports `CheckedState` type from `@radix-ui/react-checkbox`)

- [ ] **Step 1: Run the shadcn Radix migration tool**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npx shadcn@latest migrate radix
```

Expected: Tool rewrites all `@radix-ui/react-*` imports to `radix-ui` equivalents in shadcn components, updates package.json.

- [ ] **Step 2: Verify no individual Radix packages remain in package.json**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
grep "@radix-ui/react-" package.json
```

Expected: No output (no matches). If any remain, remove them manually from package.json.

- [ ] **Step 3: Check if Map/Sidebar.tsx was migrated**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
grep "@radix-ui" components/Map/Sidebar.tsx
```

Expected: No output. If the import `import { type CheckedState } from "@radix-ui/react-checkbox"` still exists, change it to:

```typescript
import { type CheckedState } from "radix-ui"
```

Note: If `radix-ui` doesn't re-export `CheckedState`, check the radix-ui unified package exports. Alternatively, replace with `boolean | "indeterminate"` which is the actual type.

- [ ] **Step 4: Install updated dependencies**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npm install
```

Expected: Clean install with no errors. `npm ls radix-ui` shows the unified package.

- [ ] **Step 5: Verify TypeScript compilation**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npx tsc --noEmit
```

Expected: No type errors related to Radix imports.

- [ ] **Step 6: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
git add package.json package-lock.json components/ 
git commit -m "chore(deps): migrate radix-ui to unified package [TEE-90]"
```

**Quality checklist:**
- [ ] Each function does one thing (SRP) — N/A (import changes only)
- [ ] No magic values — N/A
- [ ] Functions ≤40 lines, ≤3 parameters, ≤3 nesting levels — N/A
- [ ] All async operations and external boundaries have error handling — N/A
- [ ] Names reveal intent — N/A
- [ ] No duplicated logic blocks — N/A
- [ ] YAGNI — only what the task requires — N/A
- [ ] Law of Demeter — N/A

---

### Task 2: Replace tailwindcss-animate with tw-animate-css

**Files:**
- Modify: `app/globals.css:1` (add import after tailwindcss)
- Modify: `tailwind.config.ts:80` (remove plugins array)
- Modify: `package.json` (remove tailwindcss-animate from devDependencies)

- [ ] **Step 1: Add tw-animate-css import to globals.css**

In `app/globals.css`, change line 1 from:

```css
@import "tailwindcss";
```

to:

```css
@import "tailwindcss";
@import "tw-animate-css";
```

- [ ] **Step 2: Remove tailwindcss-animate plugin from tailwind.config.ts**

In `tailwind.config.ts`, change line 80 from:

```typescript
  plugins: [require("tailwindcss-animate")],
```

to (remove the entire plugins line):

```typescript
```

The line `plugins: [require("tailwindcss-animate")],` should be deleted entirely. The `}` on line 81 closes `theme`, and the config object ends naturally.

- [ ] **Step 3: Uninstall tailwindcss-animate**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npm uninstall tailwindcss-animate
```

Expected: Removed from devDependencies in package.json and package-lock.json.

- [ ] **Step 4: Verify build passes**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npx next build --webpack
```

Expected: Build succeeds with no errors. Animation classes (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) are now provided by tw-animate-css via CSS import instead of the JS plugin.

- [ ] **Step 5: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
git add app/globals.css tailwind.config.ts package.json package-lock.json
git commit -m "chore(deps): replace tailwindcss-animate with tw-animate-css [TEE-90]"
```

**Quality checklist:**
- [ ] Each function does one thing (SRP) — N/A (config changes only)
- [ ] No magic values — N/A
- [ ] Functions ≤40 lines, ≤3 parameters, ≤3 nesting levels — N/A
- [ ] All async operations and external boundaries have error handling — N/A
- [ ] Names reveal intent — N/A
- [ ] No duplicated logic blocks — N/A
- [ ] YAGNI — only what the task requires, no speculative abstractions — N/A
- [ ] Law of Demeter — N/A

---

### Task 3: Upgrade dancing-links to v4

**Files:**
- Modify: `package.json` (dancing-links version)
- Modify: `app/shapedoctor/solver.dlx.ts:1-7` (imports)
- Modify: `app/shapedoctor/solver.dlx.ts:28-152` (buildDancingLinksConstraints + findExactKTilingSolutions solver call)
- Modify: `app/shapedoctor/solver.dlx.ts:155-288` (findMaximalPlacement solver call)

- [ ] **Step 1: Upgrade the dancing-links package**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npm install dancing-links@^4.3.7
```

Expected: `npm ls dancing-links` shows `dancing-links@4.3.7`.

- [ ] **Step 2: Update imports at top of solver.dlx.ts**

Replace lines 1-7 of `app/shapedoctor/solver.dlx.ts`:

```typescript
// app/shapedoctor/solver.dlx.ts
// Dedicated solver for finding EXACT K-shape tilings using dancing-links.

// import * as dlxlib from 'dlxlib'; // Old library
// import * as dlx from 'dlx'; // Previous library
import * as dlx from 'dancing-links'; // Use the new library
import { findAll, type SimpleConstraint, type Constraint, type Result } from 'dancing-links'; 
```

with:

```typescript
// app/shapedoctor/solver.dlx.ts
// Dedicated solver for finding EXACT K-shape tilings using dancing-links.

import { DancingLinks } from 'dancing-links';
```

- [ ] **Step 3: Rewrite buildDancingLinksConstraints return type and findExactKTilingSolutions solver call**

The `buildDancingLinksConstraints` function currently returns `{ constraints: SimpleConstraint<PlacementRecord>[], columnCount: number }` and the caller feeds `constraints` into `findAll()`. In v4, we need to build the constraints as arrays and feed them into a solver instance.

**Change the return type** of `buildDancingLinksConstraints` (line 28-33). Replace:

```typescript
const buildDancingLinksConstraints = (
    allShapeData: ShapeDataMap,
    shapesToTileWith: ShapeInput[],
    initialGridState: bigint, 
    lockedTilesMask: bigint
): { constraints: SimpleConstraint<PlacementRecord>[], columnCount: number } => {
```

with:

```typescript
const buildDancingLinksConstraints = (
    allShapeData: ShapeDataMap,
    shapesToTileWith: ShapeInput[],
    initialGridState: bigint, 
    lockedTilesMask: bigint
): { constraints: { data: PlacementRecord, row: (0 | 1)[] }[], columnCount: number } => {
```

**Change the constraints array declaration** (line 55). Replace:

```typescript
    const constraints: SimpleConstraint<PlacementRecord>[] = []; 
```

with:

```typescript
    const constraints: { data: PlacementRecord, row: (0 | 1)[] }[] = []; 
```

The `push()` calls at line 136-139 already push `{ data, row }` objects — no change needed there.

**Rewrite the solver call in findExactKTilingSolutions** (lines 329-336). Replace:

```typescript
        let dlxSolutions: Result<PlacementRecord>[][] = []; // Will hold multiple solutions now
        try {
            // Find ALL solutions instead of just one
            dlxSolutions = dlx.findAll(constraints); 
        } catch(dlxError) {
            console.error("[DLX findExactKTilingSolutions] Error calling findAll:", dlxError); // Corrected message
            return { solutions: [], error: `DLX Solver Error: ${dlxError instanceof Error ? dlxError.message : String(dlxError)}` };
        }
```

with:

```typescript
        let dlxSolutions: { data: PlacementRecord, index: number }[][] = [];
        try {
            const dlx = new DancingLinks<PlacementRecord>();
            const solver = dlx.createSolver({ columns: columnCount });
            for (const constraint of constraints) {
                solver.addBinaryConstraint(constraint.data, constraint.row);
            }
            dlxSolutions = solver.findAll();
        } catch(dlxError) {
            console.error("[DLX findExactKTilingSolutions] Error calling findAll:", dlxError);
            return { solutions: [], error: `DLX Solver Error: ${dlxError instanceof Error ? dlxError.message : String(dlxError)}` };
        }
```

**Update result access** in the solution processing loop (line 356). The v4 result items have `.data` just like v2, so `item.data` still works. No change needed on lines 355-363.

- [ ] **Step 4: Rewrite findMaximalPlacement solver call**

In `findMaximalPlacement`, the current code builds `dlxOptions: Constraint<PlacementRecord>[]` with `{ primaryRow, secondaryRow, data }` objects and calls `findAll(dlxOptions)` (line 255).

**Change the dlxOptions type** (line 195). Replace:

```typescript
        const dlxOptions: Constraint<PlacementRecord>[] = [];
```

with:

```typescript
        const dlxOptions: { data: PlacementRecord, primaryRow: (0 | 1)[], secondaryRow: (0 | 1)[] }[] = [];
```

The push at lines 239-243 already matches this shape — no change needed.

**Replace the solver call** (lines 254-255). Replace:

```typescript
        // 3. Run the DLX solver
        const solutionsRaw: Result<PlacementRecord>[][] = findAll(dlxOptions) as Result<PlacementRecord>[][]; 
```

with:

```typescript
        // 3. Run the DLX solver using v4 class-based API
        const dlx = new DancingLinks<PlacementRecord>();
        const solver = dlx.createSolver({
            primaryColumns: numPrimaryColumns,
            secondaryColumns: numSecondaryColumns
        });
        for (const option of dlxOptions) {
            solver.addBinaryConstraint(option.data, [...option.primaryRow, ...option.secondaryRow]);
        }
        const solutionsRaw = solver.findAll();
```

**Update result processing** (lines 259-277). The v4 result items have `.data` property just like v2, so `item.data` access at line 267-268 still works. No change needed.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npx tsc --noEmit
```

Expected: No type errors. If there are errors about the `DancingLinks` import or types, check `node_modules/dancing-links/dist/index.d.ts` for exact export names.

- [ ] **Step 6: Verify worker build**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npm run build:worker:dev
```

Expected: Webpack builds `public/workers/solver.worker.js` with no errors. The worker imports `solver.dlx.ts` which now uses the v4 API.

- [ ] **Step 7: Verify full build**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
npm run build
```

Expected: Both worker build and Next.js build succeed with exit code 0.

- [ ] **Step 8: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-90-dependency-housekeeping
git add package.json package-lock.json app/shapedoctor/solver.dlx.ts
git commit -m "chore(deps): upgrade dancing-links v2 to v4 class-based API [TEE-90]"
```

**Quality checklist:**
- [ ] Each function does one thing (SRP) — buildDancingLinksConstraints builds constraints, findExactKTilingSolutions/findMaximalPlacement invoke solver
- [ ] No magic values — column counts derived from data, not hardcoded
- [ ] Functions ≤40 lines, ≤3 parameters, ≤3 nesting levels — existing structure preserved
- [ ] All async operations and external boundaries have error handling — try/catch around solver calls preserved
- [ ] Names reveal intent — `dlx`, `solver`, `dlxSolutions` are clear in context
- [ ] No duplicated logic blocks — solver instantiation pattern is similar but serves different constraint types (primary-only vs primary+secondary)
- [ ] YAGNI — only adapting to new API, not refactoring solver logic
- [ ] Law of Demeter — `dlx.createSolver()` then `solver.addBinaryConstraint()` / `solver.findAll()` is the intended API chain
