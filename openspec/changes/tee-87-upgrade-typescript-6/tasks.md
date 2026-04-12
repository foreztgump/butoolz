## 1. Upgrade TypeScript Package

- [x] 1.1 Update `typescript` from `^5` to `^6` in `package.json` and run `npm install`
  - **Acceptance**: `node_modules/typescript/package.json` shows version 6.x; `package-lock.json` updated
  - **Error handling**: If install fails due to peer dependency conflicts, resolve each conflict individually

## 2. Adapt tsconfig.json

- [x] 2.1 Add `"types": []` to `compilerOptions` in `tsconfig.json`
  - **Acceptance**: `compilerOptions.types` is `[]`; no `ignoreDeprecations` flag present
- [x] 2.2 Remove `"dom.iterable"` from the `lib` array in `tsconfig.json`
  - **Acceptance**: `lib` contains `["dom", "esnext", "WebWorker"]` — no `"dom.iterable"`

## 3. Adapt tsconfig.worker.json

- [x] 3.1 Add `"rootDir": "app/shapedoctor"` to `compilerOptions` in `tsconfig.worker.json`
  - **Acceptance**: Worker compilation output lands in `temp_worker_compile/` without extra nesting (e.g., `temp_worker_compile/solver.worker.js`, not `temp_worker_compile/app/shapedoctor/solver.worker.js`)

## 4. Type Check and Fix Errors

- [x] 4.1 Run `npx tsc --noEmit` and fix any new type errors
  - **Acceptance**: `npx tsc --noEmit` exits with code 0
  - **Error handling**: For each error, determine if it's a TS6 behavioral change or a genuine bug. Fix type annotations rather than using `// @ts-ignore` or type casts unless no alternative exists.

## 5. Verify All Builds

- [x] 5.1 Run `npm run build:worker:prod` and verify worker build passes
  - **Acceptance**: Build succeeds; `public/workers/solver.worker.js` is produced
- [x] 5.2 Run `npm run build` and verify Next.js build passes
  - **Acceptance**: Build completes without errors
- [x] 5.3 Run `npx jest` and verify all tests pass
  - **Acceptance**: All tests pass with exit code 0
