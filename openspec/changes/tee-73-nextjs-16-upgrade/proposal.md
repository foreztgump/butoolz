## Why

Next.js 16.1.6 is available and the project is on 15.5.x. Next.js 16 brings Turbopack as the default bundler, improved routing/prefetching, and removes several deprecated APIs. Staying current reduces security risk and ensures access to ongoing maintenance.

## What Changes

- **BREAKING**: Update `next` from `^15.5.10` to `^16.1.6`
- Update `react` and `react-dom` to latest (19.2+) for App Router compatibility
- Update `@types/react` and `@types/react-dom` to latest
- Remove `"lint": "next lint"` script (`next lint` removed in v16; no ESLint config exists so just remove it)
- Remove `--turbopack` flag from dev script (Turbopack is now the default bundler)
- Verify `output: "standalone"` still works for Docker builds
- Verify `next/font/google` and `next/image` imports still function

## Capabilities

### New Capabilities

(none — this is a dependency upgrade, not a feature addition)

### Modified Capabilities

(none — no existing specs are affected by this upgrade)

## Impact

- **Dependencies**: `next`, `react`, `react-dom`, `@types/react`, `@types/react-dom` all updated
- **Build scripts**: `package.json` scripts modified (lint removed, dev simplified)
- **Docker**: Standalone output must be verified; Dockerfile unchanged
- **PM2**: No changes expected — ecosystem.config.cjs unaffected
- **All routes**: Must render correctly after upgrade (no API changes used in codebase)

## Rollback Plan

If the upgrade breaks builds or runtime behavior:
1. Revert `package.json` changes
2. Run `npm install` to restore previous lock file
3. Verify `npm run build` passes on the reverted state
