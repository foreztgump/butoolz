## ADDED Requirements

### Requirement: Accessory data file with rune requirements
The system SHALL provide a typed data file containing all ring and necklace accessories with their perk definitions. Each accessory SHALL have a unique `id`, `name`, `type` (ring or necklace), and an array of `perks`. Each perk SHALL define an `effect` description, `runeColor` (one of purple, white, yellow, red, green), and `requiredCount` (positive integer).

#### Scenario: Data file exports typed accessory arrays
- **GIVEN** the accessory data module
- **WHEN** imported by a consumer
- **THEN** it SHALL export a `RINGS` array and a `NECKLACES` array, each containing accessory objects conforming to the `Accessory` type
- **AND** every accessory SHALL have at least one perk defined

#### Scenario: Each perk has a valid rune color
- **GIVEN** the accessory data module
- **WHEN** any perk is examined
- **THEN** its `runeColor` SHALL be one of "purple", "white", "yellow", "red", "green"
- **AND** its `requiredCount` SHALL be a positive integer

### Requirement: Perk activation computation
The system SHALL compute perk activation status by comparing the user's current rune counts against each perk's requirements. A perk is "activated" when the user's count for that rune color meets or exceeds the perk's `requiredCount`.

#### Scenario: Perk is activated when rune count meets requirement
- **GIVEN** a selected accessory with a perk requiring 3 red runes
- **WHEN** the user's rune configuration produces 3 or more red runes
- **THEN** that perk SHALL be marked as activated

#### Scenario: Perk is inactive when rune count is below requirement
- **GIVEN** a selected accessory with a perk requiring 5 white runes
- **WHEN** the user's rune configuration produces 3 white runes
- **THEN** that perk SHALL be marked as inactive
- **AND** the system SHALL report that 2 more white runes are needed

#### Scenario: Rainbow runes and mount bonus contribute to activation
- **GIVEN** a selected accessory with a perk requiring 2 green runes
- **WHEN** the user has 1 green rune, 1 rainbow rune, and mount bonus enabled
- **THEN** the green count (1 + 1 rainbow + 1 mount = 3) SHALL meet the requirement
- **AND** the perk SHALL be marked as activated

### Requirement: Runes needed indicator
For each inactive perk, the system SHALL display the deficit — how many more runes of the required color are needed to activate the perk.

#### Scenario: Display deficit for inactive perk
- **GIVEN** a perk requiring 4 purple runes and a current count of 1 purple
- **WHEN** the perk status is rendered
- **THEN** the system SHALL display "3 more purple runes needed"
