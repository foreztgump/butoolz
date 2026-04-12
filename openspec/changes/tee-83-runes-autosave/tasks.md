## 1. Auto-load configuration on mount

- [ ] 1.1 Extract a `loadSavedConfig` helper function that reads `butools_runes_config` from localStorage, parses it with backward compatibility (flat RuneValues vs `{ runeValues, mountBonusEnabled }`), and returns `{ runeValues: RuneValues, mountBonusEnabled: boolean }` or defaults on failure. Remove the separate `butools_runes_mount_bonus` read from `mountBonusEnabled` state initializer.
  - **Acceptance**: Component mounts with saved config if present; defaults if not; no flash of empty state
  - **Error handling**: try/catch around JSON.parse — return defaults on any error
  - **Quality**: Function ≤20 lines, single responsibility (parse + validate), descriptive name
  - **Test**: Add `loadSavedConfig.test.ts` — test valid config, old flat format, invalid JSON, missing key, empty storage

- [ ] 1.2 Wire `loadSavedConfig` into `useState` lazy initializers for both `runeValues` and `mountBonusEnabled`. Remove the separate `useEffect` that writes `butools_runes_mount_bonus`.
  - **Acceptance**: Both state values initialized from unified config; no separate mount bonus key written
  - **Quality**: Lazy initializer is a single function call, no inline logic

## 2. Debounced auto-save

- [ ] 2.1 Add a `useDebounce` hook (inline in the page file, same pattern as MapSearch.tsx) that accepts a value and delay, returns the debounced value.
  - **Acceptance**: Value updates are delayed by the specified ms; timer resets on new value
  - **Quality**: Hook ≤15 lines, generic type parameter, single responsibility
  - **Test**: Add `useDebounce.test.ts` — test delay behavior, reset on rapid changes, cleanup on unmount

- [ ] 2.2 Add a `useEffect` that writes `{ runeValues, mountBonusEnabled }` to localStorage whenever the debounced config value changes. Use 500ms debounce delay. Skip the initial write on mount (the value already came from localStorage).
  - **Acceptance**: Config saved after 500ms of inactivity; rapid changes produce only one write; mount does not trigger a redundant write
  - **Error handling**: try/catch around localStorage.setItem — log error, no toast (silent background operation)
  - **Quality**: Effect ≤10 lines, single responsibility (persist debounced value)

## 3. Repurpose Save/Load as Export/Import

- [ ] 3.1 Replace `saveConfiguration` with `exportConfiguration` — serialize current config to JSON and copy to clipboard via `navigator.clipboard.writeText`. Update button label to "Export" with a copy/share icon.
  - **Acceptance**: Clicking Export copies valid JSON to clipboard; success toast shown; error toast if clipboard API unavailable
  - **Error handling**: try/catch around clipboard API — show descriptive error toast on failure
  - **Quality**: Function ≤15 lines, no magic values

- [ ] 3.2 Replace `loadConfiguration` with `importConfiguration` — read from clipboard via `navigator.clipboard.readText`, parse, validate shape, apply to state. Update button label to "Import" with a paste/download icon.
  - **Acceptance**: Valid config from clipboard is applied; invalid content shows error toast without modifying state; backward-compatible with old flat format
  - **Error handling**: try/catch around clipboard read + JSON parse — show specific error messages (permission denied vs invalid format)
  - **Quality**: Function ≤20 lines, validate before applying (don't blindly setRuneValues)

## 4. Cleanup and verification

- [ ] 4.1 Remove the `MOUNT_BONUS_STORAGE_KEY` constant and its standalone `useEffect` persistence. Verify no other references to `butools_runes_mount_bonus` exist.
  - **Acceptance**: Only one localStorage key (`butools_runes_config`) is used for all rune persistence
  - **Quality**: No dead code left behind

- [ ] 4.2 Verify all acceptance criteria end-to-end: auto-save on change, auto-load on refresh, export/import round-trip, backward compat with old saves, corrupt data handling.
  - **Acceptance**: All spec scenarios pass manual verification
