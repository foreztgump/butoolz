## Why

`better-sqlite3` v12.6.2 is available; we're on v11.10.0. v12 dropped EOL Node.js 18 support but introduced no API breaking changes. Staying current reduces future upgrade friction and picks up SQLite engine updates (3.51.x).

## What Changes

- Bump `better-sqlite3` from `^11.9.1` to `^12.0.0` in package.json
- Bump `@types/better-sqlite3` to latest compatible version
- Regenerate `package-lock.json` (native addon rebuild)
- Update version references in documentation

## Capabilities

### New Capabilities

_(none — this is a dependency version bump)_

### Modified Capabilities

_(none — no API or behavioral changes)_

## Impact

- **Dependencies**: `better-sqlite3` native addon will be rebuilt against Node 20/22
- **Code**: Zero code changes — API surface is identical between v11 and v12
- **Docker**: `node:20-alpine` is supported by v12; native rebuild in Docker must succeed
- **Rollback**: Revert the package.json + package-lock.json changes and run `npm install`
