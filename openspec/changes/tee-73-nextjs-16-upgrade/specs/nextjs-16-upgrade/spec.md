# ADDED Requirements

### Requirement: Next.js 16 dependency versions
The project SHALL use Next.js ^16.1.6 with React ^19.2.0 and React-DOM ^19.2.0. Type packages (@types/react, @types/react-dom) SHALL be updated to latest compatible versions.

#### Scenario: Package versions are correct
- **GIVEN** the upgrade is complete
- **WHEN** inspecting package.json dependencies
- **THEN** `next` version is `^16.1.6`
- **AND** `react` version is `^19.2.0`
- **AND** `react-dom` version is `^19.2.0`

### Requirement: Build succeeds with standalone output
The project SHALL build successfully with `npm run build` producing standalone output suitable for Docker deployment.

#### Scenario: Production build passes
- **GIVEN** dependencies are installed
- **WHEN** running `npm run build`
- **THEN** the build completes without errors
- **AND** `.next/standalone/` directory is created

### Requirement: Deprecated lint script removed
The `"lint": "next lint"` script SHALL be removed from package.json since `next lint` is removed in Next.js 16.

#### Scenario: Lint script absent
- **GIVEN** the upgrade is complete
- **WHEN** inspecting package.json scripts
- **THEN** there is no `lint` script entry

### Requirement: Dev script uses default Turbopack
The dev script SHALL be `"next dev"` without the `--turbopack` flag since Turbopack is the default bundler in Next.js 16.

#### Scenario: Dev script is clean
- **GIVEN** the upgrade is complete
- **WHEN** inspecting package.json scripts
- **THEN** the `dev` script is `"next dev"`

### Requirement: All routes render correctly
All existing application routes SHALL continue to render without errors after the upgrade.

#### Scenario: Routes are functional
- **GIVEN** the app is built and started
- **WHEN** navigating to any existing route
- **THEN** the page renders without runtime errors

### Requirement: Docker build succeeds
The existing Dockerfile SHALL produce a working container image with the upgraded Next.js version.

#### Scenario: Docker standalone build works
- **GIVEN** the upgraded source code
- **WHEN** running `docker build`
- **THEN** the image builds successfully
- **AND** the container starts and serves the application on port 4001
