# BuTools Project Documentation

**Project:** BuTools - Gaming Utility Tools for Bless Unleashed
**Generated:** 2025-12-11
**Status:** Production

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Technical architecture, stack, patterns |
| [Project Scan Report](./project-scan-report.json) | Raw scan data and findings |

---

## Project Overview

BuTools is a web application providing utility tools for Bless Unleashed players:

- **Interactive Map** - Game world map with boss, invasion, and resource markers
- **Multi-Timer System** - Draggable countdown timers with audio alerts
- **GearScore Calculator** - Equipment stat optimization
- **Base Attack Calculator** - Build attack calculations
- **Runes Dreaming** - Rune slot configuration tool
- **Shape Doctor** - Hex puzzle solver

---

## Technology Summary

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui, Radix UI |
| **State** | Zustand |
| **Database** | SQLite (better-sqlite3) |
| **Maps** | Leaflet, react-leaflet |
| **Deployment** | Docker, PM2 |

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t butoolz .
docker run -p 4001:4001 -e BMC_ACCESS_TOKEN=xxx butoolz
```

---

## Project Structure

```
butoolz/
├── app/                    # Next.js App Router
│   ├── api/supporters/    # API endpoint
│   ├── features/timers/   # Timer feature module
│   ├── [routes]/          # Page routes
│   └── layout.tsx         # Root layout
├── components/            # Shared components
│   ├── ui/               # shadcn/ui
│   └── Map/              # Map components
├── data/                  # Data files
│   ├── map-markers/      # 22 JSON marker files
│   └── supporters.db     # SQLite database
├── lib/                   # Utilities
├── public/               # Static assets
│   ├── audio/            # Timer sounds
│   └── BlessMap/         # Map tiles
└── scripts/              # Background scripts
```

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Source Files | 105 |
| TypeScript Lines | ~9,000 |
| Routes | 8 |
| API Endpoints | 1 |
| Map Marker Categories | 22 |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BMC_ACCESS_TOKEN` | Yes | Buy Me a Coffee API token |

---

## External Services

- **Buy Me a Coffee** - Supporter data sync
- **Google Analytics 4** - Usage analytics

---

## Documentation Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-11 | 1.0.0 | Initial exhaustive scan documentation |
