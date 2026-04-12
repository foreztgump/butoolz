## ADDED Requirements

### Requirement: TypeScript 6.x dependency

The project SHALL use TypeScript 6.x as its type checker and compiler.

#### Scenario: Package version is v6

- **GIVEN** the project's `package.json`
- **WHEN** `package.json` is inspected
- **THEN** `typescript` devDependency SHALL specify `^6`

#### Scenario: Type check passes with zero errors

- **GIVEN** TypeScript 6.x is installed
- **WHEN** `npx tsc --noEmit` is executed
- **THEN** it SHALL complete with zero errors

#### Scenario: Next.js build succeeds

- **GIVEN** TypeScript 6.x is installed
- **WHEN** `npm run build` is executed
- **THEN** the Next.js build SHALL complete without TypeScript-related errors

#### Scenario: Worker build succeeds

- **GIVEN** TypeScript 6.x is installed
- **WHEN** `npm run build:worker:prod` is executed
- **THEN** the webpack worker build SHALL complete without errors
- **AND** `public/workers/solver.worker.js` SHALL be produced

#### Scenario: Jest tests pass

- **GIVEN** TypeScript 6.x is installed
- **WHEN** `npx jest` is executed
- **THEN** all tests SHALL pass

### Requirement: tsconfig.json adapted for TS6 defaults

The main `tsconfig.json` SHALL be updated to account for TypeScript 6.0 default changes.

#### Scenario: types array is explicit

- **GIVEN** `tsconfig.json` is inspected
- **WHEN** the `compilerOptions.types` field is checked
- **THEN** it SHALL be set to `[]` (TS6 default — Jest types scoped to `tsconfig.test.json` only)

#### Scenario: dom.iterable removed from lib

- **GIVEN** `tsconfig.json` is inspected
- **WHEN** the `compilerOptions.lib` field is checked
- **THEN** it SHALL NOT contain `"dom.iterable"` (merged into `"dom"` in TS6)

#### Scenario: No ignoreDeprecations flag

- **GIVEN** `tsconfig.json` is inspected
- **WHEN** `compilerOptions` is checked
- **THEN** there SHALL be no `"ignoreDeprecations"` field — all deprecations SHALL be resolved cleanly

### Requirement: tsconfig.worker.json adapted for TS6 defaults

The worker `tsconfig.worker.json` SHALL be updated to preserve output structure under TS6.

#### Scenario: rootDir explicitly set

- **GIVEN** `tsconfig.worker.json` is inspected
- **WHEN** the `compilerOptions.rootDir` field is checked
- **THEN** it SHALL be set to `"app/shapedoctor"` to preserve the flat output structure in `outDir`
