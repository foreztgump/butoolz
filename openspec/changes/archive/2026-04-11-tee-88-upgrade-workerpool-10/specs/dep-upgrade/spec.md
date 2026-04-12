## ADDED Requirements

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
