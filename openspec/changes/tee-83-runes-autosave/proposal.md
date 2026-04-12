## Why

Users can lose their rune configuration by accidentally navigating away or closing the tab. The current save/load requires explicit button clicks, which is easy to forget. Auto-saving eliminates data loss and makes the tool feel more polished.

## What Changes

- Add debounced auto-save of `runeValues` and `mountBonusEnabled` to localStorage on every change
- Auto-load saved configuration on component mount (replacing the current empty-state default)
- Repurpose existing Save/Load buttons as Export/Import (copy-to-clipboard / paste-from-clipboard) for sharing configurations between devices

## Capabilities

### New Capabilities
- `runes-autosave`: Automatic persistence of rune configuration to localStorage with debounced writes and auto-restore on mount

### Modified Capabilities
- `mount-bonus-toggle`: Mount bonus state is already persisted separately — will be unified into the single auto-save mechanism to avoid dual-write inconsistency

## Impact

- **Code**: `app/runes_dreaming/page.tsx` — new `useEffect` for auto-save, modified mount logic for auto-load, repurposed save/load button handlers
- **localStorage**: Same key `butools_runes_config` — backward compatible with existing saved configs
- **Dependencies**: None — uses only React built-ins and existing localStorage patterns
- **Rollback**: Remove the auto-save `useEffect` and restore the original `saveConfiguration`/`loadConfiguration` callbacks. No data migration needed since the storage format is unchanged.
