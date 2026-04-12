## ADDED Requirements

### Requirement: Radix UI unified package

The project SHALL use the unified `radix-ui` mono package instead of individual `@radix-ui/react-*` packages.

#### Scenario: Package consolidation

- **WHEN** `package.json` is inspected
- **THEN** there SHALL be a single `radix-ui` dependency
- **AND** there SHALL be no individual `@radix-ui/react-*` packages listed

#### Scenario: Component imports work

- **WHEN** any shadcn/ui component is imported and rendered
- **THEN** it SHALL behave identically to the pre-migration state
- **AND** all Radix-based interactions (dropdowns, tooltips, selects, accordions) SHALL function correctly

#### Scenario: Build succeeds

- **WHEN** `npm run build` is executed
- **THEN** the Next.js build SHALL complete without errors related to Radix imports

### Requirement: tw-animate-css replaces tailwindcss-animate

The project SHALL use `tw-animate-css` via CSS import instead of the abandoned `tailwindcss-animate` plugin.

#### Scenario: Plugin removed from config

- **WHEN** `tailwind.config.ts` is inspected
- **THEN** the `plugins` array SHALL NOT contain `require("tailwindcss-animate")`

#### Scenario: CSS import added

- **WHEN** `app/globals.css` is inspected
- **THEN** it SHALL contain `@import "tw-animate-css"` after the Tailwind import

#### Scenario: Package removed from dependencies

- **WHEN** `package.json` is inspected
- **THEN** `tailwindcss-animate` SHALL NOT be listed in `dependencies` or `devDependencies`
- **AND** `tw-animate-css` SHALL remain in `dependencies`

#### Scenario: Animation classes still work

- **WHEN** components using `animate-in`, `fade-in-0`, `zoom-in-95`, or `slide-in-from-*` classes are rendered
- **THEN** animations SHALL display correctly with no visual regressions

### Requirement: dancing-links v4 upgrade

The project SHALL use `dancing-links` v4.x with the class-based solver API.

#### Scenario: Package version is v4

- **WHEN** `package.json` is inspected
- **THEN** `dancing-links` dependency SHALL specify `^4.3.7`

#### Scenario: Exact k-tiling solver works

- **WHEN** `findExactKTilingSolutions` is called with valid shape data
- **THEN** it SHALL return the same solutions as the v2 implementation
- **AND** solution format (`SolutionRecord[]`) SHALL be unchanged

#### Scenario: Maximal placement solver works

- **WHEN** `findMaximalPlacement` is called with valid shape data
- **THEN** it SHALL return the same maximal solutions as the v2 implementation
- **AND** solution format SHALL be unchanged

#### Scenario: Build and worker compilation succeed

- **WHEN** `npm run build:worker:prod && next build` is executed
- **THEN** both the web worker and Next.js builds SHALL complete without errors
