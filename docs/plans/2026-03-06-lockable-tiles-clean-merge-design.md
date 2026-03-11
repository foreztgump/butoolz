# Design: Clean merge of feat/lockable-tiles

## Context

The `feat/lockable-tiles` branch contains the ShapeDoctor solver rewrite and Coolify Dockerfile changes that are running in production. It was worked on by another AI tool which deleted project tooling (CLAUDE.md, CODE_PRINCIPLES.md, etc.) and committed build artifacts. Main has since been updated with Next.js 16 (TEE-73).

## Approach

Create `feat/lockable-tiles-clean` from current main (Next.js 16). Apply feature changes from the original branch, skip tooling deletions and build artifacts.

## Keep

- ShapeDoctor feature (solver, bitmask, hex, components, types, config, worker)
- Worker webpack pipeline (worker.webpack.config.js, tsconfig.worker.json, build scripts)
- COOP/COEP headers + webpack fallbacks in next.config.ts
- Dockerfile for Coolify (port 3000, no PM2, node server.js)
- .dockerignore, .eslintrc.json, jest.config.js
- Page fixes (baseatkcal, donate, gearscore_cal, runes_dreaming, timers, home)
- API supporters route changes
- components/ui/separator.tsx
- Python utility scripts

## Discard

- Deletions of CLAUDE.md, CODE_PRINCIPLES.md, .coderabbit.yaml, openspec/, .claude/
- Deletions of docs/
- next.config.cjs (duplicate)
- README-task-master.md (AI scaffolding)
- public/workers/solver.worker.js (build artifact)
- temp_worker_compile/ (build artifact)

## Conflict Resolution

- package.json: Main's Next.js 16 + React 19.2, merge new deps/scripts
- tsconfig.json: Main's Next.js 16 config, add worker entries
- next.config.ts: Main's base + COOP/COEP + webpack fallbacks
- .gitignore: Merge, add public/workers/ and temp_worker_compile/
