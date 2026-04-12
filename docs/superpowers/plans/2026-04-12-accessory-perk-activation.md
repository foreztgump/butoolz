# Accessory Perk Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessory perk activation tracking to the runes calculator so users can see which ring/necklace perks their rune configuration activates.

**Architecture:** Extract shared types from `page.tsx`, create a colocated data file with all accessories and their rune requirements, build a pure computation function for perk activation status, and wrap it in an `AccessoryPerks` component that receives the existing `results` object as its only prop. The component manages its own selection state and localStorage persistence internally.

**Tech Stack:** React 19, TypeScript 6, Next.js 16, shadcn/ui (Select, Card, Badge), Jest + ts-jest

**Working directory:** `/home/cownose/projects/butoolz-tee-82-accessory-perks`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/runes_dreaming/types.ts` | Shared RuneType, RUNE_TYPES, Results type |
| Create | `app/runes_dreaming/data/accessories.ts` | Accessory/Perk type definitions + all game data |
| Create | `app/runes_dreaming/data/accessories.test.ts` | Data integrity tests |
| Create | `app/runes_dreaming/lib/computePerkStatus.ts` | Pure function: perk activation computation |
| Create | `app/runes_dreaming/lib/computePerkStatus.test.ts` | Unit tests for perk computation |
| Create | `app/runes_dreaming/components/AccessoryPerks.tsx` | UI component: selectors + perk display |
| Modify | `app/runes_dreaming/page.tsx` | Extract types, import AccessoryPerks, wire persistence |

---

### Task 1: Extract shared types

**Files:**
- Create: `app/runes_dreaming/types.ts`
- Modify: `app/runes_dreaming/page.tsx`

- [ ] **Step 1: Create the shared types file**

Create `app/runes_dreaming/types.ts`:

```typescript
export const RUNE_TYPES = ["purple", "white", "yellow", "red", "green"] as const;
export type RuneType = typeof RUNE_TYPES[number];
export type SelectableRuneValue = RuneType | 'rainbow' | '-';

export type Results = {
  [key in RuneType]: number;
} & {
  total: number;
  filled: number;
};
```

- [ ] **Step 2: Update page.tsx imports**

In `app/runes_dreaming/page.tsx`, remove the local definitions of `RUNE_TYPES`, `RuneType`, `SelectableRuneValue`, and `Results` type. Replace with:

```typescript
import { RUNE_TYPES, type RuneType, type SelectableRuneValue, type Results } from "./types";
```

Remove these lines from `page.tsx`:
- Line 16: `const RUNE_TYPES = ["purple", "white", "yellow", "red", "green"] as const;`
- Line 17: `type RuneType = typeof RUNE_TYPES[number];`
- Line 18: `type SelectableRuneValue = RuneType | 'rainbow' | '-';`
- Lines 130-135: The `Results` type definition

Keep `RuneValues` in `page.tsx` since it's only used there.

- [ ] **Step 3: Verify compilation**

Run: `cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npx next build --no-lint 2>&1 | tail -5`

Expected: Build succeeds (exit 0). If it fails, check import paths — `@/` alias maps to project root, but relative `./types` is simpler here.

- [ ] **Step 4: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-82-accessory-perks
git add app/runes_dreaming/types.ts app/runes_dreaming/page.tsx
git commit -m "refactor(runes): extract shared types to types.ts [TEE-82]"
```

---

### Task 2: Create accessory data file

**Files:**
- Create: `app/runes_dreaming/data/accessories.ts`
- Create: `app/runes_dreaming/data/accessories.test.ts`

- [ ] **Step 1: Write data integrity tests**

Create `app/runes_dreaming/data/accessories.test.ts`:

```typescript
import { RINGS, NECKLACES, type Accessory } from './accessories';
import { RUNE_TYPES } from '../types';

const VALID_RUNE_COLORS = new Set(RUNE_TYPES);

function validateAccessories(accessories: Accessory[], expectedType: 'ring' | 'necklace') {
  const ids = new Set<string>();

  for (const accessory of accessories) {
    expect(ids.has(accessory.id)).toBe(false);
    ids.add(accessory.id);

    expect(accessory.type).toBe(expectedType);
    expect(accessory.name.length).toBeGreaterThan(0);
    expect(accessory.perks.length).toBeGreaterThan(0);

    for (const perk of accessory.perks) {
      expect(VALID_RUNE_COLORS.has(perk.runeColor)).toBe(true);
      expect(perk.requiredCount).toBeGreaterThan(0);
      expect(Number.isInteger(perk.requiredCount)).toBe(true);
      expect(perk.effect.length).toBeGreaterThan(0);
    }
  }
}

describe('accessories data', () => {
  test('RINGS exports a non-empty array of valid ring accessories', () => {
    expect(RINGS.length).toBeGreaterThan(0);
    validateAccessories(RINGS, 'ring');
  });

  test('NECKLACES exports a non-empty array of valid necklace accessories', () => {
    expect(NECKLACES.length).toBeGreaterThan(0);
    validateAccessories(NECKLACES, 'necklace');
  });

  test('all accessory IDs are globally unique', () => {
    const allIds = [...RINGS, ...NECKLACES].map(a => a.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npx jest app/runes_dreaming/data/accessories.test.ts 2>&1 | tail -10`

Expected: FAIL — cannot find module `./accessories`

- [ ] **Step 3: Create the accessories data file**

Create `app/runes_dreaming/data/accessories.ts`:

```typescript
import type { RuneType } from '../types';

export interface AccessoryPerk {
  readonly effect: string;
  readonly runeColor: RuneType;
  readonly requiredCount: number;
}

export interface Accessory {
  readonly id: string;
  readonly name: string;
  readonly type: 'ring' | 'necklace';
  readonly perks: readonly AccessoryPerk[];
}

export const RINGS: readonly Accessory[] = [
  {
    id: "culinary_school_graduation_ring",
    name: "Culinary School Graduation Ring",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
    ],
  },
  {
    id: "horde_ring",
    name: "Horde Ring",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
    ],
  },
  {
    id: "faded_ring",
    name: "Faded Ring",
    type: "ring",
    perks: [
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 2 },
    ],
  },
  {
    id: "ring_of_avarice",
    name: "Ring of Avarice",
    type: "ring",
    perks: [
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Gathering/Mining/Logging Speed", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "bloodlust_ring",
    name: "Bloodlust Ring",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_the_whispering_serpent_god",
    name: "Ring of the Whispering Serpent God",
    type: "ring",
    perks: [
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Restores HP equal to % of damage dealt", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "dauntless_ring",
    name: "Dauntless Ring",
    type: "ring",
    perks: [
      { effect: "Increased PvP Attack Power", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "shiny_ring",
    name: "Shiny Ring",
    type: "ring",
    perks: [
      { effect: "Increased PvP Attack Power", runeColor: "purple", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_the_black_sun",
    name: "Ring of the Black Sun",
    type: "ring",
    perks: [
      { effect: "Increased PvP Attack Power", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "cyclops_ring",
    name: "Cyclops' Ring",
    type: "ring",
    perks: [
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "gideons_ring",
    name: "Gideon's Ring",
    type: "ring",
    perks: [
      { effect: "Increased Lunchbox Buff Duration", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_arrogance",
    name: "Ring of Arrogance",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "desert_song_ring",
    name: "Desert Song Ring",
    type: "ring",
    perks: [
      { effect: "Increased Lunchbox Buff Duration", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "chief_priests_ring",
    name: "Chief Priest's Ring",
    type: "ring",
    perks: [
      { effect: "Increased Potion Buff Duration", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "holy_ring",
    name: "Holy Ring",
    type: "ring",
    perks: [
      { effect: "Increased Potion Buff Duration", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "sinister_ring",
    name: "Sinister Ring",
    type: "ring",
    perks: [
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "lichs_ring",
    name: "Lich's Ring",
    type: "ring",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "violent_tides_ring",
    name: "Violent Tides Ring",
    type: "ring",
    perks: [
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_the_wolf_king",
    name: "Ring of the Wolf King",
    type: "ring",
    perks: [
      { effect: "Increased Gathering/Mining/Logging Speed", runeColor: "red", requiredCount: 1 },
    ],
  },
] as const;

export const NECKLACES: readonly Accessory[] = [
  {
    id: "horde_necklace",
    name: "Horde Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 1 },
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "shiny_necklace",
    name: "Shiny Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "crimson_necklace",
    name: "Crimson Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "faded_necklace",
    name: "Faded Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "necklace_of_the_golden_king",
    name: "Necklace of the Golden King",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "necklace_of_the_corrupted",
    name: "Necklace of the Corrupted",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Potion Healing", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 2 },
    ],
  },
  {
    id: "necklace_of_the_dead",
    name: "Necklace of the Dead",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Potion Healing", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "violent_tides_necklace",
    name: "Violent Tides Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "zealous_heart_necklace",
    name: "Zealous Heart Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "queens_necklace",
    name: "Queen's Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "necklace_of_the_tempting_flower",
    name: "Necklace of the Tempting Flower",
    type: "necklace",
    perks: [
      { effect: "Increased PvP Damage", runeColor: "purple", requiredCount: 1 },
      { effect: "Decreased Critical Hit Damage Received", runeColor: "purple", requiredCount: 2 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "cyclops_necklace",
    name: "Cyclops' Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Potion Healing", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "knight_captains_necklace",
    name: "Knight Captain's Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "roisas_necklace",
    name: "Roisa's Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Penetration", runeColor: "red", requiredCount: 1 },
    ],
  },
] as const;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npx jest app/runes_dreaming/data/accessories.test.ts 2>&1 | tail -10`

Expected: PASS — all 3 tests pass

- [ ] **Step 5: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-82-accessory-perks
git add app/runes_dreaming/data/accessories.ts app/runes_dreaming/data/accessories.test.ts
git commit -m "feat(runes): add accessory data file with rune requirements [TEE-82]"
```

---

### Task 3: Create perk activation computation

**Files:**
- Create: `app/runes_dreaming/lib/computePerkStatus.ts`
- Create: `app/runes_dreaming/lib/computePerkStatus.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/runes_dreaming/lib/computePerkStatus.test.ts`:

```typescript
import { computePerkStatus, type PerkStatus } from './computePerkStatus';
import type { Accessory } from '../data/accessories';
import type { Results } from '../types';

const makeResults = (overrides: Partial<Results> = {}): Results => ({
  purple: 0, white: 0, yellow: 0, red: 0, green: 0,
  total: 45, filled: 0,
  ...overrides,
});

const testAccessory: Accessory = {
  id: "test_ring",
  name: "Test Ring",
  type: "ring",
  perks: [
    { effect: "Increased Attack Power", runeColor: "red", requiredCount: 3 },
    { effect: "Increased Max HP", runeColor: "green", requiredCount: 2 },
  ],
};

describe('computePerkStatus', () => {
  test('returns empty array when accessory is null', () => {
    const result = computePerkStatus(null, makeResults());
    expect(result).toEqual([]);
  });

  test('marks perk as activated when count meets requirement', () => {
    const results = makeResults({ red: 5, green: 3 });
    const statuses = computePerkStatus(testAccessory, results);

    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toEqual({
      effect: "Increased Attack Power",
      runeColor: "red",
      requiredCount: 3,
      currentCount: 5,
      activated: true,
      deficit: 0,
    });
  });

  test('marks perk as inactive with correct deficit', () => {
    const results = makeResults({ red: 1, green: 0 });
    const statuses = computePerkStatus(testAccessory, results);

    expect(statuses[0]).toEqual({
      effect: "Increased Attack Power",
      runeColor: "red",
      requiredCount: 3,
      currentCount: 1,
      activated: false,
      deficit: 2,
    });
    expect(statuses[1]).toEqual({
      effect: "Increased Max HP",
      runeColor: "green",
      requiredCount: 2,
      currentCount: 0,
      activated: false,
      deficit: 2,
    });
  });

  test('perk is activated when count exactly equals requirement', () => {
    const results = makeResults({ red: 3 });
    const statuses = computePerkStatus(testAccessory, results);

    expect(statuses[0].activated).toBe(true);
    expect(statuses[0].deficit).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npx jest app/runes_dreaming/lib/computePerkStatus.test.ts 2>&1 | tail -10`

Expected: FAIL — cannot find module `./computePerkStatus`

- [ ] **Step 3: Write minimal implementation**

Create `app/runes_dreaming/lib/computePerkStatus.ts`:

```typescript
import type { Accessory } from '../data/accessories';
import type { Results, RuneType } from '../types';

export interface PerkStatus {
  readonly effect: string;
  readonly runeColor: RuneType;
  readonly requiredCount: number;
  readonly currentCount: number;
  readonly activated: boolean;
  readonly deficit: number;
}

export function computePerkStatus(
  accessory: Accessory | null,
  results: Results,
): PerkStatus[] {
  if (!accessory) return [];

  return accessory.perks.map((perk) => {
    const currentCount = results[perk.runeColor];
    const activated = currentCount >= perk.requiredCount;
    const deficit = activated ? 0 : perk.requiredCount - currentCount;

    return {
      effect: perk.effect,
      runeColor: perk.runeColor,
      requiredCount: perk.requiredCount,
      currentCount,
      activated,
      deficit,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npx jest app/runes_dreaming/lib/computePerkStatus.test.ts 2>&1 | tail -10`

Expected: PASS — all 4 tests pass

- [ ] **Step 5: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-82-accessory-perks
git add app/runes_dreaming/lib/computePerkStatus.ts app/runes_dreaming/lib/computePerkStatus.test.ts
git commit -m "feat(runes): add perk activation computation function [TEE-82]"
```

---

### Task 4: Create AccessoryPerks component

**Files:**
- Create: `app/runes_dreaming/components/AccessoryPerks.tsx`

- [ ] **Step 1: Create the AccessoryPerks component**

Create `app/runes_dreaming/components/AccessoryPerks.tsx`:

```tsx
'use client'

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Gem } from "lucide-react";
import { RINGS, NECKLACES, type Accessory } from "../data/accessories";
import { computePerkStatus, type PerkStatus } from "../lib/computePerkStatus";
import type { Results } from "../types";

const ACCESSORY_STORAGE_KEY = "butools_runes_accessories";
const NONE_VALUE = "none";

const RUNE_COLOR_CLASSES: Record<string, string> = {
  purple: "bg-purple-500",
  white: "bg-gray-100 dark:bg-gray-300 border border-gray-300 dark:border-gray-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  green: "bg-green-500",
};

function findAccessory(id: string | null, list: readonly Accessory[]): Accessory | null {
  if (!id || id === NONE_VALUE) return null;
  return list.find((a) => a.id === id) ?? null;
}

function loadPersistedSelection(): { ringId: string | null; necklaceId: string | null } {
  try {
    const saved = localStorage.getItem(ACCESSORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ringId: parsed.ringId ?? null,
        necklaceId: parsed.necklaceId ?? null,
      };
    }
  } catch {
    // localStorage unavailable or corrupted — use defaults
  }
  return { ringId: null, necklaceId: null };
}

function PerkStatusRow({ perk }: { perk: PerkStatus }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-md ${perk.activated ? "bg-green-500/10" : "bg-muted/50 opacity-70"}`}>
      {perk.activated
        ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        : <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-sm">{perk.effect}</span>
        {!perk.activated && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${RUNE_COLOR_CLASSES[perk.runeColor]}`} />
            <span className="text-xs text-muted-foreground">
              {perk.deficit} more {perk.runeColor} {perk.deficit === 1 ? "rune" : "runes"} needed
            </span>
          </div>
        )}
      </div>
      <Badge variant="outline" className="flex items-center gap-1 text-xs flex-shrink-0">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${RUNE_COLOR_CLASSES[perk.runeColor]}`} />
        {perk.currentCount}/{perk.requiredCount}
      </Badge>
    </div>
  );
}

function AccessoryCard({ accessory, perkStatuses }: { accessory: Accessory; perkStatuses: PerkStatus[] }) {
  const activatedCount = perkStatuses.filter((p) => p.activated).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{accessory.name}</CardTitle>
        <CardDescription>
          {activatedCount}/{perkStatuses.length} perks activated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {perkStatuses.map((perk) => (
          <PerkStatusRow key={`${perk.runeColor}-${perk.effect}`} perk={perk} />
        ))}
      </CardContent>
    </Card>
  );
}

export function AccessoryPerks({ results }: { results: Results }) {
  const [selectedRingId, setSelectedRingId] = useState<string | null>(() => loadPersistedSelection().ringId);
  const [selectedNecklaceId, setSelectedNecklaceId] = useState<string | null>(() => loadPersistedSelection().necklaceId);

  const selectedRing = useMemo(() => findAccessory(selectedRingId, RINGS), [selectedRingId]);
  const selectedNecklace = useMemo(() => findAccessory(selectedNecklaceId, NECKLACES), [selectedNecklaceId]);

  const ringPerkStatuses = useMemo(() => computePerkStatus(selectedRing, results), [selectedRing, results]);
  const necklacePerkStatuses = useMemo(() => computePerkStatus(selectedNecklace, results), [selectedNecklace, results]);

  const persistSelections = useCallback((ringId: string | null, necklaceId: string | null) => {
    try {
      localStorage.setItem(ACCESSORY_STORAGE_KEY, JSON.stringify({ ringId, necklaceId }));
    } catch {
      // localStorage unavailable — silently skip
    }
  }, []);

  const handleRingChange = useCallback((value: string) => {
    const id = value === NONE_VALUE ? null : value;
    setSelectedRingId(id);
    persistSelections(id, selectedNecklaceId);
  }, [selectedNecklaceId, persistSelections]);

  const handleNecklaceChange = useCallback((value: string) => {
    const id = value === NONE_VALUE ? null : value;
    setSelectedNecklaceId(id);
    persistSelections(selectedRingId, id);
  }, [selectedRingId, persistSelections]);

  const hasSelection = selectedRing || selectedNecklace;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Gem className="h-5 w-5 text-primary" /> Accessory Perks
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Select your equipped accessories to see which perks your rune configuration activates. Data sourced from community wikis.
      </p>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Ring</label>
          <Select value={selectedRingId ?? NONE_VALUE} onValueChange={handleRingChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a ring..." />
            </SelectTrigger>
            <SelectContent className="z-[100] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)] max-h-60 overflow-y-auto">
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {RINGS.map((ring) => (
                <SelectItem key={ring.id} value={ring.id}>{ring.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Necklace</label>
          <Select value={selectedNecklaceId ?? NONE_VALUE} onValueChange={handleNecklaceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a necklace..." />
            </SelectTrigger>
            <SelectContent className="z-[100] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)] max-h-60 overflow-y-auto">
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {NECKLACES.map((necklace) => (
                <SelectItem key={necklace.id} value={necklace.id}>{necklace.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Perk Status Cards */}
      {hasSelection ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedRing && <AccessoryCard accessory={selectedRing} perkStatuses={ringPerkStatuses} />}
          {selectedNecklace && <AccessoryCard accessory={selectedNecklace} perkStatuses={necklacePerkStatuses} />}
        </div>
      ) : (
        <div className="text-center p-6 border border-dashed border-muted-foreground/25 rounded-lg">
          <Gem className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Select a ring or necklace above to see which perks your runes activate.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npx tsc --noEmit app/runes_dreaming/components/AccessoryPerks.tsx 2>&1 | tail -10`

If tsc fails on JSX or imports, try: `npx next build --no-lint 2>&1 | tail -10`

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-82-accessory-perks
git add app/runes_dreaming/components/AccessoryPerks.tsx
git commit -m "feat(runes): add AccessoryPerks component with selectors and display [TEE-82]"
```

---

### Task 5: Integrate into page and wire persistence

**Files:**
- Modify: `app/runes_dreaming/page.tsx`

- [ ] **Step 1: Add the import and render the component**

In `app/runes_dreaming/page.tsx`, add the import near the top (after other imports):

```typescript
import { AccessoryPerks } from "./components/AccessoryPerks";
```

Then render `<AccessoryPerks results={results} />` inside the Configuration tab, after the Rune Distribution `</div>` closing tag (after line 505 in the original) and before the `</CardContent>` tag. Place it as:

```tsx
                 {/* Accessory Perks Section */}
                 <AccessoryPerks results={results} />
```

- [ ] **Step 2: Wire accessory selections into save/load**

The `AccessoryPerks` component manages its own localStorage key (`butools_runes_accessories`). For full integration with the Save/Load buttons, update the `saveConfiguration` and `loadConfiguration` callbacks in `page.tsx` to also include accessory IDs.

However, since `AccessoryPerks` encapsulates its own state, a simpler approach is to keep save/load separate — the component already persists on selection change. The Save/Load buttons in page.tsx handle rune config; accessory selections auto-persist independently.

**No changes needed** — the component's `persistSelections` handles this on every selection change, and `loadPersistedSelection` restores on mount. This matches how `mountBonusEnabled` has its own `MOUNT_BONUS_STORAGE_KEY` that persists independently.

For "Save Config" / "Load Config" integration, update the `saveConfiguration` callback to also include accessory state, and `loadConfiguration` to restore it. This is needed so that exported configs capture the full setup.

Update `saveConfiguration` in page.tsx:

```typescript
  const saveConfiguration = useCallback(() => {
    try {
      const accessoryData = localStorage.getItem("butools_runes_accessories");
      const configToSave = {
        runeValues,
        mountBonusEnabled,
        accessories: accessoryData ? JSON.parse(accessoryData) : null,
      };
      localStorage.setItem("butools_runes_config", JSON.stringify(configToSave));
      toast("Configuration Saved", {
        description: "Your rune configuration has been saved.",
      });
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error("Save Failed", {
        description: "Could not save configuration.",
      });
    }
  }, [runeValues, mountBonusEnabled]);
```

Update `loadConfiguration` in page.tsx:

```typescript
  const loadConfiguration = useCallback(() => {
    try {
      const savedConfig = localStorage.getItem("butools_runes_config");
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Backward compatible: old saves are flat RuneValues, new saves are nested
        if ("runeValues" in parsedConfig) {
          setRuneValues(parsedConfig.runeValues);
          setMountBonusEnabled(Boolean(parsedConfig.mountBonusEnabled));
          // Restore accessory selections if present
          if (parsedConfig.accessories) {
            localStorage.setItem("butools_runes_accessories", JSON.stringify(parsedConfig.accessories));
          }
        } else {
          setRuneValues(parsedConfig);
          setMountBonusEnabled(false);
        }
        toast("Configuration Loaded", {
          description: "Saved configuration has been loaded. Refresh to see updated accessory selections.",
        });
      } else {
        toast.info("No Saved Configuration Found");
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      toast.error("Load Failed", {
        description: "Could not load configuration.",
      });
    }
  }, []);
```

- [ ] **Step 3: Verify the full page works**

Run the dev server and verify in browser:

```bash
cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npm run dev
```

Open `http://localhost:3000/runes_dreaming` and verify:
1. Accessory Perks section appears below Rune Distribution
2. Ring and Necklace dropdowns list all accessories
3. Selecting an accessory shows perk activation status
4. Changing rune configuration updates perk status in real time
5. Activated perks show green checkmark, inactive show deficit message
6. Selecting "None" clears the perk display
7. Refreshing the page preserves accessory selections
8. Save Config / Load Config includes accessory selections

- [ ] **Step 4: Run all tests**

```bash
cd /home/cownose/projects/butoolz-tee-82-accessory-perks && npx jest 2>&1 | tail -15
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
cd /home/cownose/projects/butoolz-tee-82-accessory-perks
git add app/runes_dreaming/page.tsx
git commit -m "feat(runes): integrate accessory perks into calculator page [TEE-82]"
```
