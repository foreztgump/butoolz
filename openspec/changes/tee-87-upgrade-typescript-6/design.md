## Context

The project uses TypeScript 5.x with `strict: true`, `moduleResolution: "bundler"`, `target: "ES2020"`, and Next.js 16. There are two tsconfig files: `tsconfig.json` (main app) and `tsconfig.worker.json` (ShapeDoctor web worker built with webpack). The project already follows modern TS practices — no `baseUrl`, no `outFile`, no `es5` target, no `import assert` syntax.

TypeScript 6.0.2 shipped March 23, 2026. It changes 9 default compiler settings and deprecates several legacy options. The project is well-positioned but needs explicit adaptation for three default changes: `types` defaulting to `[]`, `dom.iterable` merging into `dom`, and `rootDir` defaulting to `.`.

## Goals / Non-Goals

**Goals:**
- Upgrade to TypeScript 6.x with zero type errors
- Adapt both tsconfig files to new TS6 defaults
- All builds pass: `tsc --noEmit`, `next build`, `build:worker:prod`, Jest tests
- No `ignoreDeprecations` flag — clean migration

**Non-Goals:**
- Adopting TS6 new features (Temporal types, `RegExp.escape`, `getOrInsert`, subpath `#/` imports)
- Upgrading to TypeScript 7.0 (Go-based native port)
- Changing `module` or `moduleResolution` strategy
- Refactoring code to use newer TS patterns

## Decisions

### 1. Explicit `types` array in tsconfig.json

**Decision**: Add `"types": []` to `tsconfig.json` — matching the new TS6 default explicitly.

**Rationale**: The main tsconfig has `noEmit: true` and Next.js handles type inclusion. Next.js's `next-env.d.ts` (already in `include`) provides the necessary type references. Adding an explicit empty array documents the intent and prevents surprise inclusions.

For `tsconfig.worker.json`, no `types` change needed — it already has a narrow `include` scope and doesn't rely on ambient `@types`.

**Alternative considered**: List all `@types/*` packages explicitly (`node`, `jest`, `react`, etc.). Rejected because Next.js manages type references via `next-env.d.ts`, and Jest runs through ts-jest which has its own tsconfig handling. Explicit listing would create maintenance burden with no benefit.

### 2. Remove `dom.iterable` from lib

**Decision**: Remove `"dom.iterable"` from the `lib` array in `tsconfig.json`. TS6 merges DOM iterable types into `"dom"`.

**Rationale**: Keeping it is harmless but generates a deprecation noise. Clean it up now.

### 3. Set explicit `rootDir` in tsconfig.worker.json

**Decision**: Add `"rootDir": "."` to `tsconfig.worker.json`.

**Rationale**: This file has `noEmit: false` and `outDir: "./temp_worker_compile"`. In TS5, `rootDir` was inferred from the `include` paths (effectively `app/shapedoctor/`). In TS6 it defaults to `.` (the tsconfig directory). Since this is the project root, and the include files are under `app/shapedoctor/`, the output would now be `temp_worker_compile/app/shapedoctor/solver.worker.js` instead of `temp_worker_compile/solver.worker.js`. The webpack config expects the flatter structure. Setting `"rootDir": "app/shapedoctor"` preserves the TS5 behavior.

**Alternative considered**: Set `rootDir: "."` and update webpack config to expect nested paths. Rejected because it changes the worker build pipeline unnecessarily for a toolchain upgrade.

### 4. Run `ts5to6` migration tool

**Decision**: Do NOT use `ts5to6`. Apply changes manually.

**Rationale**: The `ts5to6` tool primarily handles `baseUrl` removal and `rootDir` inference — neither of which applies here (no `baseUrl` in use, and `rootDir` change is straightforward). Manual changes are minimal and easier to review.

## Risks / Trade-offs

- **Silent behavioral changes in type narrowing** → Mitigated by `strict: true` already enabled; `tsc --noEmit` will surface any new errors before build.
- **Stricter generic inference for function expressions** → Could surface errors in generic JSX expressions. Mitigated by running full type check and fixing before build.
- **Next.js compatibility with TS6** → Next.js 16 supports TS6 (confirmed via GitHub discussions showing the CSS import issue was resolved). Low risk.
- **Jest/ts-jest compatibility** → ts-jest 29.x supports TS6. Low risk.
- **Worker webpack build** → Only affected by `rootDir` change, which we're handling explicitly. Low risk.
