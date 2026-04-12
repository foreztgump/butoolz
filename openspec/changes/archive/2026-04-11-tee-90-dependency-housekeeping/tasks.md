## 1. Radix UI Unified Package Migration

- [x] 1.1 Run `npx shadcn@latest migrate radix` in the worktree to consolidate 11 `@radix-ui/react-*` packages into unified `radix-ui`. Verify package.json no longer lists individual Radix packages. Check that `components/Map/Sidebar.tsx` was also migrated (fix manually if not). **Acceptance:** `grep -r "@radix-ui/react-" package.json` returns no results; `grep "radix-ui" package.json` shows the unified package.

## 2. Replace tailwindcss-animate with tw-animate-css

- [x] 2.1 Add `@import "tw-animate-css";` to `app/globals.css` immediately after `@import "tailwindcss";`. Remove `plugins: [require("tailwindcss-animate")]` from `tailwind.config.ts` (remove the entire `plugins` array if it becomes empty). Remove `tailwindcss-animate` from devDependencies via `npm uninstall tailwindcss-animate`. **Acceptance:** `globals.css` contains the tw-animate-css import; `tailwind.config.ts` has no tailwindcss-animate reference; `package.json` has no tailwindcss-animate entry. **Error handling:** If build fails after removal, check that tw-animate-css provides all animation classes used in components (animate-in, fade-in-0, zoom-in-95, slide-in-from-*).

## 3. Upgrade dancing-links v2 → v4

- [x] 3.1 Upgrade the `dancing-links` package to v4: `npm install dancing-links@^4.3.7`. **Acceptance:** `npm ls dancing-links` shows 4.x.

- [x] 3.2 Rewrite `findExactKTilingSolutions` in `app/shapedoctor/solver.dlx.ts` to use v4 class-based API. Replace `findAll(constraints)` call with `new DancingLinks<PlacementRecord>()` → `createSolver({ columns: columnCount })` → loop `addBinaryConstraint(data, row)` for each SimpleConstraint → `solver.findAll()`. Update result access from `item.data` to `item.data` (same property name in v4). **Acceptance:** TypeScript compiles with no errors in solver.dlx.ts. **Code quality:** Functions ≤40 lines, no magic values, descriptive names. SRP — keep constraint building separate from solver invocation.

- [x] 3.3 Rewrite `findMaximalPlacement` in `app/shapedoctor/solver.dlx.ts` to use v4 class-based API with primary + secondary columns. Replace `findAll(constraints)` with `new DancingLinks<PlacementRecord>()` → `createSolver({ primaryColumns: numPrimaryColumns, secondaryColumns: numSecondaryColumns })` → loop `addBinaryConstraint(data, [...primaryRow, ...secondaryRow])` → `solver.findAll()`. **Acceptance:** TypeScript compiles with no errors. **Code quality:** Same constraints as 3.2.

- [x] 3.4 Update imports at top of `solver.dlx.ts`: remove `findAll`, `SimpleConstraint`, `Constraint`, `Result` type imports. Add `import { DancingLinks } from 'dancing-links'`. Remove the unused `import * as dlx from 'dancing-links'` namespace import. **Acceptance:** No unused imports; no TypeScript errors.

## 4. Build Verification

- [x] 4.1 Run `npm run build` and verify the Next.js build passes with zero errors. If ShapeDoctor uses a separate worker build (`npm run build:worker:prod`), run that too. **Acceptance:** Both builds exit 0 with no TypeScript or bundling errors.

## 5. Lock File Cleanup

- [x] 5.1 Run `npm install` to regenerate `package-lock.json` with all dependency changes consolidated. Verify no leftover `@radix-ui/react-*` entries remain as direct dependencies (transitive deps via `radix-ui` are fine). **Acceptance:** `npm ls` shows clean tree with no missing or extraneous packages.
