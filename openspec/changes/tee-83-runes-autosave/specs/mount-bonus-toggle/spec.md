## MODIFIED Requirements

### Requirement: Mount bonus persistence
The mount collection bonus toggle state SHALL be persisted as part of the unified rune configuration in localStorage key `butools_runes_config`, alongside `runeValues`. The separate localStorage key `butools_runes_mount_bonus` SHALL no longer be written to. The separate `useEffect` that persists mount bonus independently SHALL be removed.

#### Scenario: Mount bonus saved via unified auto-save
- **GIVEN** the user toggles mount collection bonus
- **WHEN** the debounce timer (500ms) expires
- **THEN** the system writes `{ runeValues, mountBonusEnabled }` to `butools_runes_config`
- **AND** the system does NOT write to `butools_runes_mount_bonus`

#### Scenario: Mount bonus restored from unified config on mount
- **GIVEN** a saved config with `mountBonusEnabled: true` exists at `butools_runes_config`
- **WHEN** the user navigates to the runes calculator page
- **THEN** the mount bonus toggle is initialized as enabled
