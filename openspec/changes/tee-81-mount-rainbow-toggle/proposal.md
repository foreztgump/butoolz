## Why

Players who collect 4 legendary mounts in Bless Unleashed PC receive a free rainbow rune as a mount collection reward. This rainbow rune adds +1 to all 5 color counts without occupying a gear slot, but the current Runes Dreaming calculator has no way to account for this bonus — leading to inaccurate perk activation calculations.

## What Changes

- Add a toggle switch ("Mount Collection Rainbow Rune") to the rune calculator UI
- When enabled, inject +1 to all 5 color counts in the `results` useMemo calculation
- Persist toggle state in localStorage alongside existing rune configuration
- Update the distribution visualization to visually distinguish bonus runes from slot runes

## Capabilities

### New Capabilities
- `mount-bonus-toggle`: Toggle switch for the mount collection rainbow rune bonus, including state management, localStorage persistence, and integration with the results calculation

### Modified Capabilities

## Impact

- **Code**: `app/runes_dreaming/page.tsx` — new state, modified `results` useMemo, updated distribution visualization, new UI section for the toggle
- **Dependencies**: shadcn `Switch` component (needs to be added via `npx shadcn@latest add switch`)
- **APIs**: None — purely client-side
- **Rollback**: Toggle defaults to OFF, so existing behavior is unchanged. Remove the state variable and `results` modification to revert.
