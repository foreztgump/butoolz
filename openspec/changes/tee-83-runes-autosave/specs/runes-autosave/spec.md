## ADDED Requirements

### Requirement: Auto-save rune configuration on change
The system SHALL automatically persist the current rune configuration (`runeValues` and `mountBonusEnabled`) to localStorage whenever either value changes. Writes SHALL be debounced by 500ms to avoid excessive localStorage operations.

#### Scenario: Single rune change triggers auto-save
- **GIVEN** the user is on the runes calculator page
- **WHEN** the user changes a single rune slot value
- **THEN** the system writes `{ runeValues, mountBonusEnabled }` to localStorage key `butools_runes_config` after 500ms of inactivity

#### Scenario: Rapid changes are debounced
- **GIVEN** the user is on the runes calculator page
- **WHEN** the user applies a preset (changing multiple rune values within <500ms)
- **THEN** only one localStorage write occurs after the final change

#### Scenario: Mount bonus toggle triggers auto-save
- **GIVEN** the user is on the runes calculator page
- **WHEN** the user toggles the mount collection bonus
- **THEN** the system auto-saves the full config including the updated `mountBonusEnabled` value

### Requirement: Auto-load rune configuration on mount
The system SHALL restore the previously saved rune configuration from localStorage when the component mounts. Loading SHALL happen synchronously during state initialization to avoid a visual flash of empty state.

#### Scenario: Existing saved config is restored
- **GIVEN** a valid config exists at localStorage key `butools_runes_config`
- **WHEN** the user navigates to the runes calculator page
- **THEN** the system restores both `runeValues` and `mountBonusEnabled` from the saved config

#### Scenario: Backward-compatible load of old flat format
- **GIVEN** localStorage contains an old-format config (flat `RuneValues` without `mountBonusEnabled`)
- **WHEN** the user navigates to the runes calculator page
- **THEN** the system loads the flat config as `runeValues` and defaults `mountBonusEnabled` to `false`

#### Scenario: No saved config exists
- **GIVEN** no config exists at localStorage key `butools_runes_config`
- **WHEN** the user navigates to the runes calculator page
- **THEN** the system initializes with default empty rune values and `mountBonusEnabled` as `false`

#### Scenario: Corrupt saved config is handled gracefully
- **GIVEN** localStorage contains invalid JSON at key `butools_runes_config`
- **WHEN** the user navigates to the runes calculator page
- **THEN** the system falls back to default initial values without crashing

### Requirement: Export configuration to clipboard
The system SHALL allow the user to export the current rune configuration to the clipboard as a JSON string.

#### Scenario: Successful export
- **GIVEN** the user has a rune configuration
- **WHEN** the user clicks the Export button
- **THEN** the system copies the JSON config to clipboard and shows a success toast

#### Scenario: Clipboard API unavailable
- **GIVEN** the Clipboard API is not available (e.g., insecure context)
- **WHEN** the user clicks the Export button
- **THEN** the system shows an error toast explaining the failure

### Requirement: Import configuration from clipboard
The system SHALL allow the user to import a rune configuration from the clipboard, validate it, and apply it.

#### Scenario: Successful import
- **GIVEN** the clipboard contains a valid rune config JSON
- **WHEN** the user clicks the Import button
- **THEN** the system parses the JSON, applies it to state, and shows a success toast

#### Scenario: Invalid clipboard content
- **GIVEN** the clipboard contains invalid JSON or an unrecognized format
- **WHEN** the user clicks the Import button
- **THEN** the system shows an error toast and does not modify the current config
