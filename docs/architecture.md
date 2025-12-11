# BuTools Architecture Documentation

**Generated:** 2025-12-11
**Version:** 1.0.0
**Project Type:** Web Application (Monolith)

---

## Executive Summary

BuTools is a gaming utility web application for **Bless Unleashed** players. It provides calculators, interactive maps, timers, and optimization tools to enhance gameplay. Built with modern web technologies (Next.js 15, React 19, TypeScript), it features a responsive design with dark mode UI.

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.3.0 | App Router, SSR/RSC, API Routes |
| **React** | 19.0.0 | UI library with Server Components |
| **TypeScript** | ^5 | Type-safe development |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.1.3 | Utility-first CSS framework |
| **Radix UI** | Various | Accessible component primitives |
| **shadcn/ui** | - | Pre-built component library |
| **Framer Motion** | 12.6.3 | Animations and transitions |
| **Lucide React** | 0.487.0 | Icon library |

### State & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.3 | Client-side state management |
| **better-sqlite3** | 11.9.1 | SQLite database access |

### Maps & Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| **Leaflet** | 1.9.4 | Interactive map rendering |
| **react-leaflet** | 5.0.0 | React bindings for Leaflet |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization (multi-stage build) |
| **PM2** | Process management (cluster mode) |
| **node-cron** | Background task scheduling |

---

## Architecture Overview

```
butoolz/
├── app/                    # Next.js App Router (pages + API)
│   ├── api/               # API routes
│   │   └── supporters/    # GET /api/supporters
│   ├── features/          # Feature modules
│   │   └── timers/        # Timer feature (components, store, data)
│   ├── [page]/            # Route pages
│   │   ├── page.tsx       # Page component
│   │   └── ...
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Shared React components
│   ├── ui/               # shadcn/ui components
│   └── Map/              # Map-related components
├── data/                  # Static data files
│   ├── map-markers/      # JSON marker data (22 files)
│   └── supporters.db     # SQLite database
├── lib/                   # Utility functions
├── public/               # Static assets
│   ├── audio/            # Timer sound files
│   └── BlessMap/         # Map tile images
├── scripts/              # Background scripts
│   ├── scheduler.mjs     # PM2 scheduler entry
│   └── fetchSupporters.mjs # BMC API sync
└── [config files]        # Various config files
```

---

## Feature Architecture

### 1. Home Page (`/`)
**Purpose:** Landing page with feature navigation and supporter showcase.

**Components:**
- `SupporterList` - Fetches and displays supporters from API
- Feature cards linking to tools

**Data Flow:**
```
SupporterList → fetch('/api/supporters') → SQLite DB → Display names
```

---

### 2. Interactive Map (`/map`)
**Purpose:** Full-screen interactive game map with marker overlays.

**Components:**
- `MapContent` - Main Leaflet map container
- Dynamic marker loading from JSON files

**Data Sources:**
- `public/BlessMap/` - Map tile images (zoom levels 0-6)
- `data/map-markers/*.json` - 22 marker category files

**Marker Categories:**
- Boss locations (elite, unique)
- Invasion points (fire, ice, darkness, light, growth, chaos)
- Resources (ancient chest, bag piece, books, pages)
- NPCs (smuggler merchant, telepost)
- Wildlife (golden stag, giant panda, moonwind lioness, etc.)

---

### 3. Multi-Timer System (`/timers`)
**Purpose:** Multiple draggable/resizable countdown timers with audio alerts.

**Architecture:**
```
timersStore.ts (Zustand)
    ├── Timer instances
    ├── Position/size state
    └── Audio preferences

Timer.tsx
    ├── useAudio hook (Web Audio API)
    ├── DraggableWrapper (custom)
    ├── ResizableBox (react-resizable)
    └── Visual warning states
```

**Features:**
- Drag & drop positioning
- Resizable timer widgets
- Voice or beep audio modes
- Visual color warnings (yellow/red thresholds)
- Timer presets for game events

**Presets Include:**
- Boss respawn timers
- Invasion countdowns
- Custom timers

---

### 4. GearScore Calculator (`/gearscore_cal`)
**Purpose:** Calculate equipment gear scores and stats.

**Components:**
- Input forms for equipment stats
- Real-time score calculation
- Comparison tools

---

### 5. Base Attack Calculator (`/baseatkcal`)
**Purpose:** Optimize base attack stats for builds.

**Components:**
- Stat input interface
- Attack calculation logic
- Build recommendations

---

### 6. Runes Dreaming (`/runes_dreaming`)
**Purpose:** Rune configuration and optimization tool.

**Features:**
- 9 gear pieces × 5 slots = 45 rune slots
- 5 rune types (purple, white, yellow, red, green) + rainbow
- Preset configurations (Balanced, Attack, Defense)
- Distribution visualization
- localStorage persistence

**Data Model:**
```typescript
type RuneType = 'purple' | 'white' | 'yellow' | 'red' | 'green';
type SelectableRuneValue = RuneType | 'rainbow' | '-';
```

---

### 7. Shape Doctor (`/shapedoctor`)
**Purpose:** Hex puzzle solver for game mechanics.

**Architecture:**
- Canvas-based hex grid rendering
- Web Worker for solving (`solver.worker.ts`)
- Predefined shape library (34 patterns)

**Interaction:**
- Click to select hexes (max 4)
- Save potential shapes
- Solve for optimal placement
- Zoom/pan canvas navigation

---

### 8. Donation Page (`/donate`)
**Purpose:** Support page with payment options.

**Payment Methods:**
- Buy Me a Coffee integration
- Cryptocurrency wallets (BTC, ETH, XMR)

---

## Data Layer

### SQLite Database
**Location:** `data/supporters.db`

**Schema:**
```sql
CREATE TABLE supporters (
  name TEXT PRIMARY KEY
);
```

**Sync Process:**
```
PM2 Scheduler (every 30 min)
    └── fetchSupporters.mjs
        ├── Fetch from Buy Me a Coffee API
        ├── Parse supporter names
        └── Upsert to SQLite
```

### Static JSON Data
**Location:** `data/map-markers/`

**Structure:**
```json
[
  {
    "lat": -15.66561,
    "lng": 38.09401,
    "popup": "Wolf King<br>Pasture's Crossing",
    "title": "Wolf King",
    "img": ""
  }
]
```

---

## API Reference

### GET `/api/supporters`
Returns list of supporter names from SQLite database.

**Response:**
```json
{
  "names": ["Alice", "Bob", "Charlie"]
}
```

**Error Response:**
```json
{
  "error": "Supporter database not found.",
  "names": []
}
```

---

## Deployment Architecture

### Docker Configuration
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
# Build Next.js standalone output

FROM node:20-alpine AS runner
# Run with PM2 ecosystem
EXPOSE 4001
CMD ["pm2-runtime", "ecosystem.config.cjs"]
```

### PM2 Ecosystem
```javascript
module.exports = {
  apps: [
    {
      name: 'butoolz-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4001',
      instances: 'max',
      exec_mode: 'cluster'
    },
    {
      name: 'butoolz-scheduler',
      script: 'scripts/scheduler.mjs',
      instances: 1,
      cron_restart: '*/30 * * * *'
    }
  ]
};
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BMC_ACCESS_TOKEN` | Yes | Buy Me a Coffee API token |

---

## Development Workflow

### Local Development
```bash
npm install
npm run dev        # Start dev server on port 3000
```

### Production Build
```bash
npm run build      # Generate standalone output
npm start          # Start production server
```

### Docker
```bash
docker build -t butoolz .
docker run -p 4001:4001 -e BMC_ACCESS_TOKEN=xxx butoolz
```

---

## Code Statistics

| Metric | Value |
|--------|-------|
| **Source Files** | 105 |
| **TypeScript Lines** | ~9,000 |
| **Components** | ~30 |
| **Routes** | 8 |
| **API Endpoints** | 1 |

---

## Key Patterns

### 1. Feature Module Pattern
Features are organized in `app/features/[feature]/` with:
- `components/` - Feature-specific components
- `store/` - Zustand state management
- `data/` - Feature-specific data/types
- `types.ts` - TypeScript definitions

### 2. Client Components
Most interactive components use `'use client'` directive for:
- useState/useEffect hooks
- Browser APIs (Web Audio, Canvas)
- Third-party libraries (Leaflet, Framer Motion)

### 3. Server Components
Used for:
- Layout components
- Static page wrappers
- Data fetching (API routes)

---

## External Integrations

### Buy Me a Coffee API
- **Purpose:** Fetch supporter list
- **Frequency:** Every 30 minutes via scheduler
- **Storage:** SQLite database

### Google Analytics 4
- **Purpose:** Usage analytics
- **Implementation:** Cookie consent + gtag.js
- **Events:** Page views, feature usage

---
