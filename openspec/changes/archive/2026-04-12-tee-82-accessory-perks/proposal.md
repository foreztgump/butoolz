## Why

The runes calculator currently counts rune colors across gear but doesn't show which accessory (ring/necklace) perks those runes activate — which is the entire purpose of the rune system in Bless Unleashed. Users must cross-reference external wikis to know if their rune distribution activates their accessories' perks. This is the highest-value improvement for the calculator, transforming it from a counter into an actual build planner.

## What Changes

- Add a structured data file containing all rings and necklaces with their perk definitions (rune color + count required per perk)
- Add a new "Accessory Perks" UI section to the runes calculator showing activated vs inactive perks based on current rune counts
- Show "X more [color] runes needed" indicators for perks that are close to activation
- Add accessory selector dropdowns so users can pick their equipped ring and necklace for targeted perk tracking
- Persist selected accessories in localStorage alongside existing rune configuration

## Capabilities

### New Capabilities
- `accessory-perk-activation`: Data model and calculation logic for determining which accessory perks are activated by current rune counts, including "runes needed" computation
- `accessory-selector-ui`: UI components for selecting equipped accessories and displaying perk activation status within the runes calculator

### Modified Capabilities
_None — the existing rune counting logic is unchanged. The new feature reads from the existing `results` state._

## Impact

- **Code**: `app/runes_dreaming/page.tsx` — new UI section added, new state for selected accessories
- **Data**: New file `app/runes_dreaming/data/accessories.ts` containing ring/necklace perk definitions
- **Storage**: New localStorage key for persisted accessory selections (backward compatible with existing save/load)
- **Dependencies**: None — uses existing shadcn/ui components only
- **APIs**: None — purely client-side
