## Context

The Runes Dreaming calculator (`app/runes_dreaming/page.tsx`) is a single-file React component managing 45 rune slots across 9 gear pieces. The `results` useMemo computes color counts from slot values. localStorage persistence stores the full `runeValues` record under `butools_runes_config`. The mount collection bonus is a game mechanic that grants a free rainbow rune (+1 all colors) outside the slot system.

## Goals / Non-Goals

**Goals:**
- Allow users to toggle the mount collection rainbow rune bonus
- Reflect the bonus accurately in all computed results and visualizations
- Persist the toggle state across sessions
- Make the bonus visually distinct from slot-assigned runes

**Non-Goals:**
- Supporting multiple mount collection bonuses or variable bonus amounts
- Refactoring the page into separate component files (single-file pattern is established)
- Adding other mount collection rewards beyond the rainbow rune

## Decisions

### 1. State management: single boolean state variable

**Approach A (chosen):** Add `mountBonusEnabled` boolean state alongside existing `runeValues`. Modify the `results` useMemo to add +1 to each color when enabled.

**Approach B (rejected):** Create a separate "bonus runes" data structure that could hold multiple bonus types. Rejected because YAGNI — there's only one mount bonus, and a boolean is the simplest correct solution.

**Rationale:** The bonus is a single on/off flag. A boolean keeps the interface simple (deep module principle — the results calculation hides the bonus logic behind a simple toggle).

### 2. Persistence: separate localStorage key

**Approach A (chosen):** Store the toggle in a dedicated key `butools_runes_mount_bonus`. Load it on component mount via a state initializer.

**Approach B (rejected):** Extend the existing `butools_runes_config` object to include the toggle. Rejected because the existing save/load is manual (button-click) and stores only `runeValues`. Mixing concerns would require migrating the existing data shape and changing the save/load logic.

**Rationale:** Separate keys keep each concern independent. The toggle auto-persists on change (unlike the manual save/load for rune slots), which matches user expectations for a simple toggle.

### 3. UI placement: above the distribution visualization

Place the toggle in the Configuration tab, between the rune table and the distribution bars. This positions it logically — it's a modifier to the results shown below it. Use shadcn `Switch` + `Label` components for consistency.

### 4. Bonus visualization: annotation on color counts

When enabled, show the bonus contribution as `count (+1)` next to each color bar. This distinguishes slot runes from the bonus without adding visual clutter.

## Risks / Trade-offs

- **[Stale localStorage]** → If the key name changes in a future update, old toggle state is orphaned. Mitigation: key name is simple and stable; no migration needed.
- **[Single-file growth]** → Adding more state to an already 541-line file. Mitigation: the addition is minimal (~30 lines) and follows existing patterns. Refactoring to separate files is out of scope.
