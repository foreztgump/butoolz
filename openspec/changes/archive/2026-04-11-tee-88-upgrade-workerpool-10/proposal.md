## Why

workerpool v10.0.1 is available (currently on ^9.2.0). This is a major version bump for a critical dependency — ShapeDoctor's parallel solver relies on workerpool for web worker pool management. Staying current reduces security and compatibility risk.

## What Changes

- Upgrade `workerpool` from `^9.2.0` to `^10.0.0` in `package.json`
- Verify all workerpool API usage remains compatible with v10 breaking changes:
  - Internal `pool.tasks` renamed to `pool.taskQueue` (we don't use this)
  - New `TerminateError` class with changed error messages (we check `CancellationError`, not message strings)
  - New `queueStrategy` option (additive, no migration needed)
- Verify webpack worker build still produces valid output
- Verify both solver modes (exact tiling, maximal packing) function correctly

## Capabilities

### New Capabilities

_(none — this is a dependency upgrade)_

### Modified Capabilities

- `dep-upgrade`: Adding workerpool v10 requirement alongside the existing better-sqlite3 v12 requirement

## Impact

- **Dependencies**: `workerpool` ^9.2.0 → ^10.0.0 in package.json and package-lock.json
- **Code**: `app/shapedoctor/page.tsx` (pool creation, exec calls), `app/shapedoctor/solver.worker.ts` (worker registration, CancellationError, isCancelled, workerEmit)
- **Build**: `worker.webpack.config.js` bundles the solver worker — must still compile
- **Rollback**: Revert package.json version to `^9.2.0` and `npm install`
