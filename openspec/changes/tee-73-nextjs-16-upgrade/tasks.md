## 1. Update Dependencies

- [x] 1.1 Update `next` from `^15.5.10` to `^16.1.6` in package.json
- [x] 1.2 Update `react` from `^19.0.0` to `^19.2.0` in package.json
- [x] 1.3 Update `react-dom` from `^19.0.0` to `^19.2.0` in package.json
- [x] 1.4 Update `@types/react` and `@types/react-dom` to latest in devDependencies
- [x] 1.5 Run `npm install` and resolve any peer dependency conflicts
  - **Acceptance**: `npm install` completes without errors; `node_modules` is consistent
  - **Error handling**: If peer conflicts arise, check which package is incompatible and pin to a compatible version

## 2. Update Build Scripts

- [x] 2.1 Remove `"lint": "next lint"` from package.json scripts
- [x] 2.2 Change dev script from `"next dev --turbopack"` to `"next dev"`
  - **Acceptance**: `package.json` scripts section has `dev`, `build`, `start` only (no `lint`); dev script has no `--turbopack` flag

## 3. Verify Build

- [x] 3.1 Run `npm run build` and confirm it succeeds with standalone output
  - **Acceptance**: Build completes without errors; `.next/standalone/` directory exists
  - **Error handling**: If build fails, check error output for removed API usage or config incompatibility. Fall back to `next build --webpack` to isolate Turbopack vs app issues.

## 4. Verify Docker Build

- [ ] 4.1 Run `docker build -t butoolz-test .` and confirm image builds (SKIPPED: Docker not available in environment)
  - **Acceptance**: Docker image builds successfully
  - **Error handling**: If Dockerfile fails, check if standalone output structure changed in v16

## 5. Smoke Test

- [x] 5.1 Start the app (`npm run dev` or from Docker) and verify key routes render
  - **Acceptance**: Homepage, at least 2 feature routes (e.g., `/runes_dreaming`, `/gearscore_cal`), and the supporters page all render without console errors
  - **Error handling**: If a route fails, check for removed Next.js API usage in that route's components
