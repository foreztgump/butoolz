# mount-bonus-toggle Specification

## Purpose
Defines the mount collection rainbow rune bonus toggle for the Runes Dreaming calculator. This bonus grants +1 to all 5 color counts when enabled, reflecting the 4 legendary mounts collection reward without occupying a gear slot.
## Requirements
### Requirement: Mount collection rainbow rune toggle
The system SHALL display a toggle switch labeled "Mount Collection Rainbow Rune" in the Configuration tab of the Runes Dreaming page. The toggle SHALL default to OFF.

#### Scenario: Toggle is visible on page load
- **GIVEN** the user navigates to the Runes Dreaming page
- **WHEN** the page renders
- **THEN** a toggle switch labeled "Mount Collection Rainbow Rune" is visible in the Configuration tab, between the rune table and the distribution visualization

### Requirement: Toggle adds bonus to all color counts
The system SHALL add +1 to all 5 color counts (purple, white, yellow, red, green) in the results calculation when the mount bonus toggle is enabled. The bonus SHALL NOT affect the filled slots count or occupy any gear slot.

#### Scenario: Enabling the toggle increases all color counts
- **GIVEN** the toggle is OFF and the current color counts are known
- **WHEN** the user enables the toggle
- **THEN** each of the 5 color counts increases by exactly 1

#### Scenario: Disabling the toggle removes the bonus
- **GIVEN** the toggle is ON
- **WHEN** the user disables the toggle
- **THEN** each of the 5 color counts decreases by exactly 1, returning to slot-only values

#### Scenario: Toggle does not affect filled slots count
- **GIVEN** the toggle is ON
- **WHEN** the results are calculated
- **THEN** the filled slots count reflects only actual slot assignments, not the mount bonus

### Requirement: Toggle state persists in localStorage
The system SHALL persist the mount bonus toggle state in localStorage so it survives page reloads and browser sessions.

#### Scenario: Toggle state survives page reload
- **GIVEN** the user enables the toggle
- **WHEN** the user reloads the page
- **THEN** the toggle is still enabled and the +1 bonus is reflected in the results

#### Scenario: Default state when no saved value exists
- **GIVEN** no mount bonus value exists in localStorage
- **WHEN** the page loads
- **THEN** the toggle defaults to OFF

### Requirement: Distribution visualization reflects the bonus
The distribution bars and stats SHALL reflect the mount bonus when enabled. The bonus contribution SHALL be visually distinguished from slot-assigned runes.

#### Scenario: Bars update when toggle is enabled
- **GIVEN** the toggle is OFF and the distribution bars show slot-only counts
- **WHEN** the user enables the toggle
- **THEN** each color bar grows to reflect the +1 bonus and the count display shows the bonus annotation

#### Scenario: Bonus is visually distinguished
- **GIVEN** the toggle is ON
- **WHEN** the user views the distribution visualization
- **THEN** each color count displays an annotation indicating the mount bonus contribution (e.g., "+1" indicator)

