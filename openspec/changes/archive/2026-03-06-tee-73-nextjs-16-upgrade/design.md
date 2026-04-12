## Context

butoolz runs Next.js 15.5.x with React 19.0, Tailwind CSS 4, and deploys via Docker standalone output with PM2. The codebase is simple: no middleware, no async request APIs, no ESLint config, no parallel routes. The `next.config.ts` contains only `output: "standalone"`.

## Goals / Non-Goals

**Goals:**
- Upgrade to Next.js 16.1.6 with compatible React version
- Maintain Docker standalone build pipeline
- Remove deprecated `next lint` script
- Clean up dev script (Turbopack is now default)

**Non-Goals:**
- Enabling new Next.js 16 features (Cache Components, proxy.ts, React Compiler)
- Adding ESLint/Biome to replace `next lint`
- Upgrading Node.js base image (node:20-alpine already satisfies 20.9+ requirement)

## Decisions

### 1. Dependency update strategy

**Approach A (chosen): Direct version bump** — Update `next` to `^16.1.6`, `react`/`react-dom` to `^19.2.0`, and type packages to latest. Run `npm install` and fix any peer dependency issues.

**Approach B (rejected): Use Next.js codemod** — `npx @next/codemod@canary upgrade latest` automates the upgrade. Rejected because the codebase has no deprecated API usage, so the codemod would only bump versions — same as manual but with less control.

**Rationale**: The codebase doesn't use any removed APIs. A direct bump is simpler and more transparent.

### 2. Lint script removal

**Approach A (chosen): Remove the lint script entirely.** The project has no `.eslintrc` or `eslint.config` file. `next lint` was the only linting mechanism and it's removed in v16.

**Approach B (rejected): Replace with direct ESLint CLI.** Out of scope — adding a linter is a separate concern.

### 3. Dev script cleanup

Remove `--turbopack` from `"dev": "next dev --turbopack"`. Turbopack is the default in v16. The flag is harmless but misleading.

## Risks / Trade-offs

- **[Risk] Turbopack build incompatibility** — Turbopack is now used for production builds by default. If any build issue arises, can fall back with `next build --webpack`.
  - Mitigation: Run full build and verify standalone output.

- **[Risk] React 19.2 canary features** — App Router uses React canary. Unlikely to cause issues since we don't use bleeding-edge React APIs.
  - Mitigation: Smoke test all routes after upgrade.

- **[Risk] next/image default changes** — `minimumCacheTTL` changed from 60s to 4h, `qualities` changed to `[75]` only. These are server-side optimization defaults, not breaking for rendering.
  - Mitigation: Verify images render correctly in header and map popup.

## Open Questions

None — the upgrade path is clear given the minimal config surface.
