## 1. Upgrade Dependency

- [x] 1.1 Update `workerpool` version in `package.json` from `^9.2.0` to `^10.0.0` and run `npm install`
  - **Acceptance**: `npm ls workerpool` shows 10.x installed, no peer dependency warnings
  - **Error handling**: If install fails, check for peer conflicts and resolve

## 2. Build Verification

- [x] 2.1 Run webpack worker build (`npm run build:worker:prod`) and verify `public/workers/solver.worker.js` is produced
  - **Acceptance**: Build exits 0, output file exists, no warnings about missing exports
  - **Error handling**: If build fails, check webpack resolve/fallback config for any new Node.js module imports in workerpool v10

- [x] 2.2 Run full project build (`npm run build`) and verify Next.js compilation succeeds
  - **Acceptance**: Build exits 0, no TypeScript errors related to workerpool types

## 3. API Compatibility Verification

- [x] 3.1 Verify `workerpool.Promise.CancellationError` still exists in v10 — inspect the installed package exports
  - **Acceptance**: The class is accessible and extends `Error`
  - **Note**: If removed, update `solver.worker.ts:544` to use the replacement

- [x] 3.2 Verify `workerpool.workerEmit` and `workerpool.worker` exports are unchanged
  - **Acceptance**: Both are exported functions in v10

## 4. Documentation

- [x] 4.1 Update CHANGELOG.md with the upgrade entry
  - **Acceptance**: Entry follows existing format with TEE-88 reference
