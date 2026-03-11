## Context

`better-sqlite3` is a native Node.js addon providing synchronous SQLite access. It's used in two places: the `/api/supporters` API route (read-only) and the `scripts/fetchSupporters.mjs` scheduler script (read-write). The upgrade from v11 to v12 is a Node.js minimum version bump only — no API changes.

## Goals / Non-Goals

**Goals:**
- Upgrade `better-sqlite3` to v12.x (latest 12.6.2)
- Upgrade `@types/better-sqlite3` to latest
- Verify native addon compiles on local Node 22 and Docker Node 20 (alpine)

**Non-Goals:**
- Refactoring SQLite usage patterns
- Adding tests (no test framework exists yet)
- Upgrading SQLite engine separately from the library

## Decisions

**Approach: Direct version bump (chosen over pinned version)**
- Use `^12.0.0` range to receive future v12.x patches automatically
- Alternative considered: pin to `12.6.2` exactly — rejected because the `^` pattern is already used throughout package.json and better-sqlite3 follows semver reliably

**No code changes needed**
- v12.0.0 release notes confirm the only breaking change is dropping Node 18 support
- All APIs used (`Database` constructor, `.prepare()`, `.all()`, `.run()`, `.exec()`, `.pragma()`, `.transaction()`, `.close()`, `.open`) are unchanged

## Risks / Trade-offs

- **[Native addon rebuild failure on Alpine]** → Mitigated by: `node:20-alpine` is in the v12 prebuild matrix. If prebuilds aren't available, `npm ci` falls back to compilation (alpine has build tools in the Docker stage).
- **[Rollback]** → Revert package.json and package-lock.json, run `npm install`.
