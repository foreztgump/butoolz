## ADDED Requirements

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
