# BuTools Architecture Documentation

**Generated:** 2026-04-11
**Stack:** Next.js 16.1.6 / React 19.2 / TypeScript 5 (strict) / Tailwind CSS 4

---

## Executive Summary

BuTools is a gaming utility web application for **Bless Unleashed PC** players. It provides calculators, interactive maps, timers, and a hexagonal puzzle solver. Built as a Next.js monolith with dark-mode-only UI, deployed via Docker on Coolify.

---

## Technology Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | App Router, SSR/RSC, API routes, standalone output |
| React | 19.2.0 | UI library with Server Components |
| TypeScript | ^5 | Strict mode, ES2020 target |
| Zustand | 5.0.3 | Client-side state management |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.1.3 | Utility-first CSS framework |
| Radix UI | Various | 16 accessible component primitives |
| shadcn/ui | — | Pre-built component library on Radix |
| Framer Motion | 12.6.3 | Animations (timer pulse, transitions) |
| Lucide React | 0.575.0 | Icon library |

### Maps & Geometry
| Technology | Version | Purpose |
|------------|---------|---------|
| Leaflet | 1.9.4 | Interactive map rendering |
| react-leaflet | 5.0.0 | React bindings for Leaflet |
| honeycomb-grid | 4.1.5 | Hexagonal grid math |
| Fuse.js | 7.0.0 | Fuzzy search for map markers |

### Data & Math
| Technology | Version | Purpose |
|------------|---------|---------|
| better-sqlite3 | 12.0.0 | SQLite read-only access |
| mathjs | 14.4.0 | Combination calculations |
| workerpool | 9.2.0 | Worker pool for ShapeDoctor solver |

### Build & Dev
| Technology | Version | Purpose |
|------------|---------|---------|
| Webpack | 5.99.6 | Worker compilation only |
| ts-loader | 9.5.2 | TypeScript loader for worker webpack |
| Jest + ts-jest | 29.3.2 | Unit tests (minimal coverage) |

---

## Architecture Overview

```
butoolz/
├── app/                       # Next.js App Router
│   ├── api/supporters/        # GET /api/supporters (SQLite)
│   ├── features/timers/       # Timer feature module
│   │   ├── components/        # Timer.tsx, TimerPresetSelector.tsx
│   │   ├── store/             # timersStore.ts (Zustand)
│   │   ├── data/              # timerPresets.ts
│   │   └── types.ts
│   ├── baseatkcal/            # Base attack calculator
│   ├── donate/                # Donation page
│   ├── gearscore_cal/         # Gear score calculator
│   ├── map/                   # Interactive game map
│   ├── runes_dreaming/        # Rune configuration tool
│   ├── shapedoctor/           # Hex puzzle solver + worker
│   ├── timers/                # Timer page (routes to feature)
│   ├── layout.tsx             # Root layout (dark mode, GA, fonts)
│   └── page.tsx               # Home page
├── components/                # Shared components
│   ├── ui/                    # 16 shadcn/ui Radix components
│   └── Map/                   # 10 Leaflet map components
├── data/
│   ├── map-markers/           # 21 JSON marker category files
│   └── supporters.db          # SQLite (read-only from app)
├── lib/
│   ├── map-data.ts            # Marker loading + icon config
│   └── utils.ts               # cn() Tailwind merge utility
├── public/
│   ├── audio/                 # Timer sound files
│   ├── BlessMap/              # Map tile images (large binaries)
│   ├── data/map-markers/      # Public copy of marker JSONs
│   └── workers/               # Compiled worker output (gitignored)
├── scripts/
│   ├── fetchSupporters.mjs    # BMC API → SQLite sync
│   └── scheduler.mjs          # node-cron wrapper (see Deployment)
├── openspec/                  # OpenSpec change artifacts
├── docs/                      # This documentation
└── [config files]
```

---

## Routes & Pages

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server + Client | Home page with tool cards and supporter list |
| `/map` | Client | Full-screen Leaflet map with 21 marker categories, search, temp markers |
| `/gearscore_cal` | Client | Gear score calculator by rank, fortification, and level |
| `/baseatkcal` | Client | Base attack stat calculator with tooltips |
| `/runes_dreaming` | Client | 9 gear × 5 slots rune configuration with presets and export |
| `/timers` | Client | Draggable/resizable countdown timers with Web Audio alerts |
| `/shapedoctor` | Client | Hexagonal puzzle solver (exact tiling + maximal packing) |
| `/donate` | Server | Buy Me a Coffee + crypto donation links |

### API Endpoints

**`GET /api/supporters`** — Returns `{ names: string[] }` from `data/supporters.db`.
Falls back to `{ error: "...", names: [] }` if DB missing.

---

## State Management

**Single Zustand store:** `useTimersStore` in `app/features/timers/store/timersStore.ts`

```
State: activeTimers[] → { instanceId, preset, position, size }
Actions: addTimer, removeTimer, updateTimerPosition, updateTimerSize
```

No persistence — timers reset on page reload.
Map temporary markers use `localStorage` (`blessmap_temp_markers` key).
Theme via `next-themes` with `localStorage`.

---

## Data Layer

### SQLite Database (`data/supporters.db`)

| Table | Schema |
|-------|--------|
| supporters | `name TEXT PRIMARY KEY` |

Populated by `scripts/fetchSupporters.mjs` which fetches from Buy Me a Coffee API endpoints (`/supporters` + `/subscriptions`). Uses WAL mode. Read-only from the Next.js app.

### Static JSON Data

**Map markers** (`data/map-markers/` — 21 files): Boss locations, invasion points, mount spawns, resources, NPCs. Each entry: `{ lat, lng, popup, title, img }`.

**Map locations** (`public/data/map-locations.json`): 9 region definitions with coordinates.

---

## Worker Architecture (ShapeDoctor)

### Problem Domain
44-tile hexagonal grid. Users select tetromino shapes (4-tile pieces) and solve for either exact tiling (K shapes cover all tiles) or maximal packing (fit as many as possible). Tiles can be locked.

### Build Pipeline
```
Source: app/shapedoctor/solver.worker.ts
  → Webpack (worker.webpack.config.js)
  → Output: public/workers/solver.worker.js
  → Loaded by workerpool in page.tsx
```

Build: `npm run build:worker:dev` (dev) or `build:worker:prod` (prod). Main build runs both: `build:worker:dev && next build --webpack`.

### Worker Exports (via workerpool)

1. **`initializeSolverContext(potentials, lockedTilesMask)`** — Precomputes all valid placements for each shape, filtering locked tiles. Returns `ShapeDataMap`.

2. **`processParallelTask(task)`** — Handles two task types:
   - `DLX_BATCH`: Processes combination batches for exact tiling (Dancing Links / Algorithm X)
   - `BACKTRACKING_BRANCH`: Branch-and-bound for maximal packing

### Grid Representation
Bitmask-based: 44-bit `BigInt` where each bit = one tile. Operations in `bitmaskUtils.ts`: place, overlap check, popcount, rotate (60° on hex axial coords), translate.

### Parallel Strategy
- **Exact tiling**: Generate C(n,k) combinations → batch across workers → first solution wins
- **Maximal packing**: Dispatch N+1 branches (one per shape decision) → aggregate results

### Security Headers
`/shapedoctor` and `/workers` routes require COOP/COEP headers for `SharedArrayBuffer` (set in `next.config.ts`).

---

## Deployment

### Docker (Dockerfile)
Multi-stage build: `node:20-alpine`. Stages: deps → builder → runner.
Runner: `NODE_ENV=production`, user `nextjs`, `CMD ["node", "server.js"]`.

Dockerfile has `EXPOSE 3000` / `ENV PORT=3000`, but Coolify injects `PORT=4001` at runtime.
The container listens on **port 4001**.

### Coolify
- **App UUID:** `d8swgw40o08w4ksgswg884kg`
- **Server:** Datalix - Personal_Dev
- **FQDN:** `www.butools.xyz`, `butools.xyz`
- **Proxy:** Traefik (via Cloudflare Tunnel)
- **Build pack:** dockerfile
- **Source:** `foreztgump/butoolz` branch `main`
- **Env vars:** `BMC_ACCESS_TOKEN` only (build + runtime)

### Scheduler Status

`scripts/scheduler.mjs` (node-cron, every 15 min) and `ecosystem.config.cjs` (PM2) exist in the repo, but:
- The Dockerfile runs `node server.js` only — does NOT start the scheduler
- No separate scheduler service exists in Coolify
- **The BMC supporter sync is NOT running in production**

The `supporters.db` contains data from whenever the scheduler last ran (likely pre-Docker migration). New supporters are not being synced.

---

## Shared Components

### `components/ui/` (16 shadcn/ui components)
accordion, badge, button, card, checkbox, dropdown-menu, Hexagon, input, label, progress, scroll-area, select, separator, sonner, table, tabs, tooltip

### `components/Map/` (10 files)
Map.tsx (main container), MapWrapper.tsx, MapSearch.tsx (Fuse.js), MarkerLayer.tsx, MarkerPopup.tsx, TemporaryMarkerLayer.tsx, Sidebar.tsx, LocationLayers.tsx, CustomMapControls.tsx, TextOverlay.tsx

### `components/` (root — 7 files)
header.tsx, footer.tsx, theme-provider.tsx, mode-toggle.tsx, cookie-consent.tsx, SupporterList.tsx, ui-components.tsx

---

## Key Patterns

### Component Architecture
- **Server components**: `layout.tsx`, page metadata wrappers
- **Client components**: All interactive pages (`"use client"`)
- Feature modules in `app/features/<name>/` with `components/`, `store/`, `data/`, `types.ts`
- Shared UI in `components/ui/` (Radix/shadcn), domain components at `components/` root

### Data Flow
- **Calculators**: Synchronous — input → state → instant calculation → display
- **Map**: Async — mount → fetch marker JSONs → load icons → render layers
- **ShapeDoctor**: Worker parallelism — solve request → precompute → dispatch N tasks → aggregate
- **Supporters**: Cron → BMC API → SQLite → API route → React state

### Error Handling
- Try-catch around database ops, worker init, audio loading
- Toast notifications (Sonner) for user-facing errors
- Graceful degradation: missing audio doesn't crash timers, missing map data logs warning

---

## Environment Variables

| Variable | Required | Context | Description |
|----------|----------|---------|-------------|
| `BMC_ACCESS_TOKEN` | Yes | Build + Runtime | Buy Me a Coffee API token |
| `NODE_ENV` | Auto | Runtime | Set to `production` in Dockerfile |
| `PORT` | Auto | Runtime | 4001 (Coolify runtime injection; Dockerfile default is 3000) |

---

## Code Statistics

| Metric | Value |
|--------|-------|
| TypeScript/TSX source files | 66 |
| Total lines of code | ~11,850 |
| ShapeDoctor solver | ~4,065 lines (35%) |
| Routes / pages | 8 |
| API endpoints | 1 |
| UI components (shadcn) | 16 |
| Map components | 10 |
| Zustand stores | 1 |
| Worker modules | 1 (+ 5 support files) |

---

## Extension Points

**New calculator page**: Create `app/newcalc/page.tsx` → add card to `app/page.tsx`.

**New timer preset**: Add entry to `timerPresets.ts` + audio files to `public/audio/`.

**New map marker category**: Add JSON to `data/map-markers/` → add icon config to `lib/map-data.ts` → add to `controllableCategories` in `Map.tsx`.

**New Zustand store**: Create in `app/features/<name>/store/` per existing pattern.
