## Context

The runes calculator (`app/runes_dreaming/page.tsx`, ~593 lines) is a single-file client component using React hooks + localStorage. It tracks rune colors across 9 gear pieces (45 slots) and computes color totals via `useMemo`. The `results` object already provides `{ purple, white, yellow, red, green, total, filled }` counts — the new feature reads these counts to determine perk activation.

The game has two accessory categories — rings and necklaces. Each accessory has 2-3 perks, and each perk requires a specific count of a specific rune color to activate. Data was compiled from community wikis and official patch notes.

## Goals / Non-Goals

**Goals:**
- Show users which accessory perks their current rune configuration activates
- Show how many more runes of each color are needed for inactive perks
- Let users select their equipped ring and necklace for targeted planning
- Persist accessory selections in localStorage

**Non-Goals:**
- Dimensional accessory support (Lv35/40 tier with multi-threshold perks) — future enhancement
- Accessory stat values (exact +X% numbers) — these vary by gear tier and are less useful than activation status
- Modifying the existing rune counting engine — read-only consumer of existing state

## Decisions

### 1. Data file structure

**Approach A (chosen): Flat typed array in a colocated data file**
Each accessory is an object with `id`, `name`, `type` (ring/necklace), and a `perks` array. Each perk has `effect` (string), `runeColor` (RuneType), and `requiredCount` (number).

**Approach B (rejected): Grouped by rune color**
Organizing data by color (like the wiki source) makes lookup by color easy but makes per-accessory rendering harder — the UI needs to show perks grouped by the selected accessory, not by color.

**Rationale:** The UI renders perk status per-accessory, so the data should be structured per-accessory. Color-based lookups are trivial with a filter.

### 2. UI placement

**Approach A (chosen): New section within the Configuration tab, below distribution**
The perk status is most useful alongside the rune configuration — users adjust runes and immediately see the effect on perk activation. Adding it below the existing distribution visualization keeps the workflow natural.

**Approach B (rejected): New third tab**
Would hide the perk information behind a click, breaking the "adjust and see" feedback loop.

**Rationale:** Colocating with configuration maximizes the planner value. The section is collapsible if it gets long.

### 3. State management

**Approach A (chosen): Local `useState` + localStorage, matching existing pattern**
The calculator already uses `useState` + localStorage for rune values and mount bonus. Adding `selectedRing` and `selectedNecklace` state follows the same pattern.

**Approach B (rejected): Extract to Zustand store**
Would be the right call if other pages consumed accessory state, but this is self-contained.

**Rationale:** Consistent with existing component pattern. YAGNI — no external consumers.

### 4. Perk activation computation

A `useMemo` hook computes perk activation status from `results` + selected accessories. For each perk on each selected accessory, it compares `results[perk.runeColor]` against `perk.requiredCount`. This is O(n) where n is the number of perks on the two accessories (max ~6) — negligible cost.

### 5. Component extraction

The main page.tsx is already 593 lines. Rather than growing it further, extract the new accessory section into a separate component file `AccessoryPerks.tsx` colocated in the same route directory. It receives `results` as a prop — a simple, deep-module interface that hides the accessory data, selection state, and perk computation.

**Information hiding:** The `AccessoryPerks` component encapsulates:
- Accessory data definitions
- Selection state and persistence
- Perk activation computation
- "Runes needed" calculation

**Interface:** `<AccessoryPerks results={results} />` — one prop, all complexity hidden.

**Dependency direction:** The page component depends on `AccessoryPerks` (high → low). `AccessoryPerks` depends on the data file and shared types. No circular dependencies.

## Risks / Trade-offs

- **[Data accuracy]** Rune requirements compiled from community wikis (2020-2021 era) may have errors or miss newer accessories. → Mitigation: Structure data for easy correction. Add a note in the UI that data is community-sourced.
- **[Page length]** Adding accessory section increases scroll depth on the Configuration tab. → Mitigation: The section only shows content when accessories are selected, keeping it compact by default.
- **[localStorage migration]** Adding accessory selections to save/load must not break existing configs. → Mitigation: Backward-compatible detection (same pattern used for mount bonus addition in TEE-81).
