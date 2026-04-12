## 1. State & Persistence

- [x] 1.1 Add `mountBonusEnabled` boolean state with localStorage initializer. Read from `butools_runes_mount_bonus` on mount, default to `false` if missing. Write to localStorage on every toggle change via a `useEffect`.
  - **Acceptance**: State initializes from localStorage; toggling persists immediately; page reload preserves state.
  - **Error handling**: Wrap localStorage reads in try/catch, fall back to `false`.
  - **Quality**: No magic strings — extract the storage key as a named constant.

## 2. Results Calculation

- [x] 2.1 Modify the `results` useMemo to add +1 to each color count when `mountBonusEnabled` is true. Add `mountBonusEnabled` to the dependency array. Do NOT modify the `filled` count — the bonus is not a slot assignment.
  - **Acceptance**: Each of the 5 color counts increases by exactly 1 when toggle is ON; `filled` stays unchanged; disabling removes the +1.
  - **Quality**: Keep the modification minimal — a single conditional block after the existing counting loop.

## 3. Toggle UI

- [x] 3.1 Add a toggle switch using shadcn `Switch` + `Label` components in the Configuration tab, positioned between the rune table and the distribution visualization. Label: "Mount Collection Rainbow Rune". Include a brief description text explaining the bonus.
  - **Acceptance**: Toggle is visible, labeled, and functional. Clicking it toggles `mountBonusEnabled`.
  - **Quality**: Use existing UI patterns (spacing, typography) from the page. No new wrapper components.

## 4. Distribution Visualization Update

- [x] 4.1 Update the distribution bar count display to show a bonus annotation when `mountBonusEnabled` is true. Show the count with a `(+1)` suffix next to each color count to distinguish bonus from slot runes.
  - **Acceptance**: When toggle is ON, each color count shows e.g. "10 (+1)". When OFF, shows just "10". Bars reflect the updated total counts.
  - **Quality**: Keep the annotation inline — no new DOM structure beyond a conditional `<span>`.

## 5. Save/Load Integration

- [x] 5.1 Update `saveConfiguration` and `loadConfiguration` to include the mount bonus toggle state. When saving, also write the toggle to localStorage. When loading, also restore the toggle state.
  - **Acceptance**: Save captures toggle state; Load restores it; toggle state round-trips through save/load cycle.
  - **Error handling**: If loaded config lacks the toggle key, default to `false` (backward compatibility).
