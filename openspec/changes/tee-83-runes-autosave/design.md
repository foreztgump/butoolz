## Context

The runes calculator (`app/runes_dreaming/page.tsx`) is a single client component managing 45 rune slots across 9 gear pieces. State is held in React `useState` hooks: `runeValues` (Record<string, SelectableRuneValue>) and `mountBonusEnabled` (boolean). Manual save/load uses `localStorage` key `butools_runes_config` with format `{ runeValues, mountBonusEnabled }`. Mount bonus is also persisted separately under `butools_runes_mount_bonus`, creating a dual-write pattern.

## Goals / Non-Goals

**Goals:**
- Auto-persist rune configuration on every change with no user action required
- Auto-restore configuration on page load
- Unify mount bonus persistence into the single auto-save mechanism
- Repurpose Save/Load buttons for cross-device sharing (clipboard export/import)
- Maintain backward compatibility with existing saved configs

**Non-Goals:**
- Cloud sync or multi-device persistence (clipboard export covers this manually)
- Undo/redo history
- Versioned config migrations beyond current backward compat

## Decisions

### 1. Debounce strategy: `useDebounce` hook on state value

**Chosen:** Create a `useDebounce` hook (same pattern as `MapSearch.tsx`) to debounce the combined config value, then a `useEffect` that writes debounced value to localStorage.

**Alternative considered:** Debounce at the write call site using `setTimeout` in the `handleRuneChange` callback. Rejected because it requires tracking timer refs across multiple change sources (rune change, preset apply, fill empty, mount toggle, reset) and is error-prone.

**Rationale:** The hook approach is declarative — any state change, regardless of source, triggers the debounced save. Simple interface (pass value + delay), complex implementation hidden inside the hook.

### 2. Debounce delay: 500ms

Rune changes are discrete clicks (not keystrokes), so saves are infrequent. 500ms is fast enough to feel instant but avoids redundant writes during rapid preset/fill operations.

### 3. Auto-load: Initialize state from localStorage via `useState` lazy initializer

**Chosen:** Pass a function to `useState<RuneValues>(() => loadFromStorage())` that reads localStorage and returns either the saved config or the default initial values.

**Alternative considered:** Load in a `useEffect` on mount. Rejected because it causes a flash — component renders with empty state, then re-renders with loaded state. Lazy initializer avoids this entirely.

**Rationale:** This is the standard React pattern for derived initial state. No flash, no extra render, no loading state needed.

### 4. Unify mount bonus persistence

Remove the separate `butools_runes_mount_bonus` localStorage key. Both `runeValues` and `mountBonusEnabled` are saved/loaded together under `butools_runes_config`. The existing separate `useEffect` for mount bonus persistence is removed.

### 5. Repurpose Save/Load as Export/Import

- **Export**: Serialize config to JSON, copy to clipboard via `navigator.clipboard.writeText`
- **Import**: Read from clipboard via `navigator.clipboard.readText`, parse, validate, apply
- Clipboard API requires user gesture (button click satisfies this) and secure context (HTTPS — production is on butools.xyz)

**Alternative considered:** File download/upload. Rejected as heavier UX for a simple config blob.

### 6. Keep the hook inline (no extraction to shared module)

The `useDebounce` hook is ~10 lines. It's used in two places (MapSearch and runes) with no coupling between them. Extracting to a shared hook file is premature — YAGNI. If a third use appears, extract then.

## Risks / Trade-offs

- **[Risk] Clipboard API unavailable in older browsers or HTTP** → Fallback: wrap in try/catch, show toast error suggesting manual copy. The auto-save feature works regardless.
- **[Risk] Corrupt localStorage data on load** → Existing try/catch pattern handles this. On parse failure, fall back to default initial values.
- **[Risk] Removing separate mount bonus key breaks nothing** → The key was only read on mount init. After this change, mount init reads from the unified config. Old separate key is simply ignored (not cleaned up — no harm in orphaned key).
- **[Trade-off] 500ms debounce means a very fast close could lose the last change** → Acceptable for a calculator tool. The debounce fires on unmount cleanup? No — `useEffect` cleanup cancels the timer. We could add a `beforeunload` save, but that's over-engineering for this use case.
