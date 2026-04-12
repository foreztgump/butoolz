# BuTools

Gaming utility toolkit for **Bless Unleashed PC** players. Calculators, interactive maps, timers, and a hexagonal puzzle solver — all in one dark-mode web app.

**Live:** [butools.xyz](https://butools.xyz)

## Features

- **Interactive Map** — Full-screen Leaflet map with 21 marker categories (bosses, invasions, mounts, resources, NPCs). Fuzzy search, temporary markers with localStorage persistence.
- **Shape Doctor** — Hexagonal puzzle solver with exact tiling (Dancing Links) and maximal packing (backtracking). Parallelized via Web Workers with SharedArrayBuffer.
- **Multi-Timer** — Draggable/resizable countdown timers with Web Audio alerts, voice/beep modes, and game-specific presets (Backflow, Reflect, Fire, Lightning, Fuse Storm).
- **Gear Score Calculator** — Calculate gear scores by rank, fortification tier, and level for all armor pieces.
- **Base Attack Calculator** — Compute base attack values with stat inputs and tooltips.
- **Runes Dreaming** — Configure rune slots across 9 gear pieces (45 slots total) with presets, distribution visualization, and export.
- **Supporter Wall** — Buy Me a Coffee integration showing supporter names.

## Tech Stack

Next.js 16 (App Router) / React 19.2 / TypeScript (strict) / Tailwind CSS 4 / Zustand / Leaflet / Radix UI + shadcn/ui / better-sqlite3 / Webpack (worker build)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### ShapeDoctor Worker

The Shape Doctor solver requires a pre-built web worker:

```bash
npm run build:worker:dev   # development
npm run build:worker:prod  # production
```

Output goes to `public/workers/solver.worker.js` (gitignored).

### Production Build

```bash
npm run build   # runs build:worker:dev && next build --webpack
npm start
```

## Deployment

Deployed via Docker on [Coolify](https://coolify.io) at [butools.xyz](https://butools.xyz).

```bash
docker build -t butoolz .
docker run -p 4001:4001 -e BMC_ACCESS_TOKEN=xxx -e PORT=4001 butoolz
```

The Dockerfile produces a standalone Next.js server (`node server.js`). Coolify injects `PORT=4001` at runtime.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BMC_ACCESS_TOKEN` | Yes | Buy Me a Coffee API token for supporter sync |

## License

Private project.
