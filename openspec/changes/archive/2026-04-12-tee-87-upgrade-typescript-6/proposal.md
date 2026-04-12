## Why

TypeScript 6.0.2 is the current stable release (shipped March 23, 2026). The project is on `^5`, which is now in maintenance mode. TS 6.0 is a transition release preparing for 7.0 (the native Go port) — every deprecation suppressed with `ignoreDeprecations: "6.0"` becomes a hard error in 7.0. Upgrading now avoids compounding migration debt.

## What Changes

- Upgrade `typescript` from `^5` to `^6` in `package.json`
- Add explicit `"types"` array to `tsconfig.json` — TS6 defaults `types` to `[]`, disabling auto-discovery of `@types/*` packages
- Remove `"dom.iterable"` from `lib` in `tsconfig.json` — merged into `"dom"` in TS6
- Set explicit `"rootDir"` in `tsconfig.worker.json` — TS6 defaults `rootDir` to `.` instead of inferring from source files, which would change `outDir` nesting
- Fix any new type errors surfaced by TS6 behavioral changes (stricter generic inference for function expressions in generic calls)

## Capabilities

### New Capabilities

_None — this is a toolchain upgrade, not a feature addition._

### Modified Capabilities

- `dep-upgrade`: Adding TypeScript 6.x as a required dependency version with its tsconfig adaptation requirements

## Impact

- **package.json**: `typescript` version bump
- **tsconfig.json**: `types` array addition, `lib` cleanup
- **tsconfig.worker.json**: explicit `rootDir` to preserve output structure
- **Source files**: Potentially any `.ts`/`.tsx` file if TS6 surfaces new type errors
- **Build pipeline**: Next.js build, worker webpack build, Jest test suite all must pass
- **Rollback plan**: Revert `typescript` to `^5` in `package.json` and undo tsconfig changes. No source code changes are expected to be TS5-incompatible, so rollback is a clean `git revert`.
