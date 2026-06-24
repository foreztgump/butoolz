# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed
- **[TEE-87]** Upgraded TypeScript 5 → 6 (adapted tsconfig defaults, added `tsconfig.test.json` for Jest TS6 compatibility)

### Fixed
- Eliminated all npm audit vulnerabilities (was 23: 3 high, 19 moderate, 1 low)
- Upgraded `next` 16.2.3 → 16.2.9 — patches 3 high-severity advisories (DoS in Server Components, middleware/proxy bypass via segment-prefetch routes, SSRF in WebSocket upgrades) plus moderate XSS/cache-poisoning issues (fixed in 16.2.6)
- Upgraded `jest` 29 → 30 + `@types/jest` 30 (latest test toolchain; all 36 tests pass)
- Upgraded `postcss` 8.5.9 → 8.5.15 via direct bump + override — patches moderate XSS via unescaped `</style>` in stringify output (also dedupes the copy nested under `next`)
- Added `js-yaml` override (^4.1.2) — patches moderate vuln in the `@istanbuljs/load-nyc-config` → `js-yaml` 3.x dev-only chain (3.x is EOL with no patched release)
- Patch/minor bumps across all deps (React 19.2.5 → 19.2.7, radix-ui 1.4.3 → 1.6.0, lucide-react 1.8.0 → 1.21.0, better-sqlite3, framer-motion, tailwindcss, zustand, mathjs, fuse.js, node-cron, and others)
- Upgraded `mathjs` 14.x → 15.x (high-severity prototype pollution vulnerability, Dependabot #61)
- **[TEE-90]** Migrated 11 individual `@radix-ui/react-*` packages to unified `radix-ui` mono package (v1.4.3)
- **[TEE-90]** Replaced abandoned `tailwindcss-animate` plugin with `tw-animate-css` CSS import
- **[TEE-90]** Upgraded `dancing-links` v2.1.1 → v4.3.7 (class-based solver API)
- **[TEE-88]** Upgraded workerpool 9 → 10

### Added
- **[TEE-81]** Mount collection rainbow rune toggle — dedicated toggle to fill all empty slots with rainbow runes for mount gear
- Onboarding verification: updated all operating docs (CLAUDE.md, CODE_PRINCIPLES.md, openspec/config.yaml, .coderabbit.yaml, docs/architecture.md)
- OpenMemory checkpoints section in CLAUDE.md
- Linear Integration section in CLAUDE.md

## 2026-03-11

### Changed
- Updated openspec skills, commands, and added specs/archive directories

## 2026-03-06

### Changed
- **[TEE-78]** Upgraded react-cookie-consent 9 → 10
- **[TEE-77]** Upgraded lucide-react 0.487 → 0.575
- **[TEE-76]** Upgraded dotenv 16 → 17
- **[TEE-75]** Upgraded node-cron 3 → 4

### Added
- **[TEE-73]** Lockable tiles feature for ShapeDoctor solver (parallel backtracking + DLX)

### Fixed
- ShapeDoctor: use dev mode for worker webpack build
- ShapeDoctor: add COEP header to worker path

## 2026-03-05

### Changed
- **[TEE-73]** Upgraded Next.js 15 → 16, React 19.0 → 19.2
- **[TEE-74]** Upgraded better-sqlite3 11 → 12

## 2026-02-27

### Changed
- Updated semver-compatible dependencies
- Onboarded project with workflow tooling (CLAUDE.md, CODE_PRINCIPLES.md, .coderabbit.yaml, openspec)

## 2026-02-26

### Fixed
- Patched 6 dependency vulnerabilities

### Changed
- Removed unused dependencies and tooling

## 2025-12-18

### Fixed
- Patched Next.js and systeminformation vulnerabilities

## 2025-12-11

### Fixed
- Patched 11 vulnerabilities including critical RCE

## 2025-04-16 — 2025-04-17

### Fixed
- Timer: improved final sound playback logic

### Changed
- Timer: simplified timer completion logic

## 2025-04-14 — 2025-04-15

### Added
- Interactive map with Leaflet integration and marker categories
- Google Analytics with cookie consent banner
- Cross-device drag handling for timers

### Changed
- Optimized runes component performance
- Docker build stages optimized
- PM2 configuration for production

## 2025-04-11 — 2025-04-13

### Added
- Initial project scaffold (Create Next App)
- Homepage with feature navigation cards
- Gear score calculator
- Base attack calculator
- Runes Dreaming configuration tool
- Shape Doctor hexagonal puzzle solver
- Multi-timer system with Web Audio
- Donation page (BMC + crypto)
- Docker containerization
- Supporter list with SQLite + BMC API sync
