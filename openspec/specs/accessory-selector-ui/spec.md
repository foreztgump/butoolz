## ADDED Requirements

### Requirement: Accessory selector dropdowns
The system SHALL provide two dropdown selectors — one for ring, one for necklace — allowing users to select their equipped accessories from the full list.

#### Scenario: User selects a ring
- **GIVEN** the Accessory Perks section is visible
- **WHEN** the user opens the ring selector dropdown
- **THEN** it SHALL list all available rings by name
- **AND** include a "None" option to deselect

#### Scenario: User selects a necklace
- **GIVEN** the Accessory Perks section is visible
- **WHEN** the user opens the necklace selector dropdown
- **THEN** it SHALL list all available necklaces by name
- **AND** include a "None" option to deselect

### Requirement: Perk activation display
The system SHALL display a card for each selected accessory showing its perks with visual activation status.

#### Scenario: Display activated perk
- **GIVEN** a selected accessory with an activated perk
- **WHEN** the perk list is rendered
- **THEN** the perk SHALL display with a green checkmark indicator
- **AND** show the perk effect text and the rune color/count that satisfied it

#### Scenario: Display inactive perk with deficit
- **GIVEN** a selected accessory with an inactive perk needing 3 more yellow runes
- **WHEN** the perk list is rendered
- **THEN** the perk SHALL display with a dimmed/inactive visual state
- **AND** show "3 more yellow runes needed" with the appropriate color indicator

#### Scenario: No accessory selected
- **GIVEN** neither ring nor necklace is selected
- **WHEN** the Accessory Perks section is rendered
- **THEN** it SHALL display a prompt encouraging the user to select accessories

### Requirement: Persist accessory selections
The system SHALL save and restore selected accessories using localStorage, integrated with the existing save/load configuration flow.

#### Scenario: Selections persist across page reloads
- **GIVEN** the user has selected a ring and necklace
- **WHEN** the page is reloaded
- **THEN** the previously selected accessories SHALL be restored

#### Scenario: Save/Load includes accessories
- **GIVEN** the user clicks "Save Config"
- **WHEN** the configuration is saved to localStorage
- **THEN** the selected ring and necklace IDs SHALL be included in the saved config
- **AND** loading a config SHALL restore the accessory selections

#### Scenario: Backward compatible with old saves
- **GIVEN** a saved configuration from before this feature existed
- **WHEN** the user loads it
- **THEN** the rune configuration SHALL load normally
- **AND** accessory selections SHALL default to "None"
