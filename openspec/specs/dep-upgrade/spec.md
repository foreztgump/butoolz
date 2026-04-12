# dep-upgrade Specification

## Purpose
TBD - created by archiving change tee-74-upgrade-better-sqlite3. Update Purpose after archive.
## Requirements
### Requirement: better-sqlite3 v12 dependency

The project SHALL use `better-sqlite3` v12.x as its SQLite database driver.

#### Scenario: Package version is v12
- **WHEN** `package.json` is inspected
- **THEN** `better-sqlite3` dependency SHALL specify `^12.0.0`
- **AND** `@types/better-sqlite3` SHALL be at latest compatible version

#### Scenario: API route reads supporters
- **WHEN** `GET /api/supporters` is called
- **THEN** the route SHALL return supporter names from the SQLite database
- **AND** behavior SHALL be identical to v11

#### Scenario: Scheduler writes supporters
- **WHEN** `fetchSupporters.mjs` runs
- **THEN** it SHALL write supporter data to the SQLite database
- **AND** behavior SHALL be identical to v11

#### Scenario: Docker build succeeds
- **WHEN** `docker build` is run with the project Dockerfile
- **THEN** the native addon SHALL compile successfully on `node:20-alpine`

#### Scenario: Project builds successfully
- **WHEN** `npm run build` is executed
- **THEN** the Next.js build SHALL complete without errors

### Requirement: workerpool v10 dependency

The project SHALL use `workerpool` v10.x for web worker pool management in ShapeDoctor.

#### Scenario: Package version is v10
- **GIVEN** the project's package.json
- **WHEN** `package.json` is inspected
- **THEN** `workerpool` dependency SHALL specify `^10.0.0`

#### Scenario: Worker pool initializes without errors
- **GIVEN** the ShapeDoctor page is loaded in a browser
- **WHEN** the page component mounts
- **THEN** `workerpool.pool()` SHALL create a pool with `workerType: 'web'` without errors
- **AND** no console errors SHALL appear

#### Scenario: Exact tiling solver works
- **GIVEN** a ShapeDoctor puzzle with an exact tiling solution
- **WHEN** the solver is invoked via `pool.exec('processParallelTask', [dlxBatchTask])`
- **THEN** the worker SHALL return valid solutions
- **AND** `workerpool.workerEmit()` progress messages SHALL be received by the main thread

#### Scenario: Maximal packing solver works
- **GIVEN** a ShapeDoctor puzzle requiring maximal packing
- **WHEN** the solver is invoked via `pool.exec('processParallelTask', [backtrackingTask])`
- **THEN** the worker SHALL return valid packing results

#### Scenario: Worker build passes
- **GIVEN** the webpack worker build configuration
- **WHEN** `npm run build:worker:prod` is executed
- **THEN** the build SHALL complete without errors
- **AND** `public/workers/solver.worker.js` SHALL be produced

#### Scenario: Project builds successfully
- **GIVEN** workerpool v10 is installed
- **WHEN** `npm run build` is executed
- **THEN** the Next.js build SHALL complete without errors

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

