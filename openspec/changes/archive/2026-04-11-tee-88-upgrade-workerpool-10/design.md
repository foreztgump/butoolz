## Context

ShapeDoctor uses `workerpool` to manage a pool of web workers that run CPU-intensive tile-solving algorithms. The pool is created in `app/shapedoctor/page.tsx` with `workerpool.pool()` and workers register via `workerpool.worker()` in `app/shapedoctor/solver.worker.ts`. Currently on v9.3.4 (declared ^9.2.0), upgrading to v10.0.1.

workerpool v10 breaking changes:
1. Internal `pool.tasks` renamed to `pool.taskQueue`
2. New `TerminateError` class with some changed error messages
3. New `queueStrategy` option (FIFO/LIFO/custom)

## Goals / Non-Goals

**Goals:**
- Upgrade workerpool to ^10.0.0 with zero behavioral change
- Verify all existing API usage is compatible
- Ensure webpack worker build passes
- Confirm both solver modes work

**Non-Goals:**
- Adopting new v10 features (queueStrategy, TerminateError)
- Refactoring worker code
- Changing solver behavior

## Decisions

### Approach: Version bump + verify (over cautious wrapper)

**Option A (chosen): Direct version bump.** Change package.json, run npm install, build worker, verify. Our code uses only public API (`pool()`, `exec()`, `worker()`, `workerEmit()`, `Promise.CancellationError`). None of these changed in v10.

**Option B (rejected): Wrapper abstraction.** Create a thin wrapper around workerpool to isolate version changes. Rejected because the API surface is stable and small — a wrapper adds complexity for zero benefit (YAGNI).

**Rationale:** The breaking changes are internal (`pool.tasks` → `pool.taskQueue`) and error message text. We don't access `pool.tasks` directly, and our error handling checks error types not message strings. Direct bump is safe.

### CancellationError verification

The solver uses `workerpool.Promise.CancellationError` and `(workerpool as any).isCancelled()`. These are part of the documented API and not mentioned in breaking changes, but we'll verify at build + runtime.

## Risks / Trade-offs

- **[Low] CancellationError API changed** → Mitigated by verifying `workerpool.Promise.CancellationError` still exists after install. If removed, would need to import `TerminateError` instead.
- **[Low] workerEmit behavior changed** → Mitigated by testing both solver modes which rely on worker-to-main messaging.
- **[Trivial] Error messages changed** → Our code doesn't match on error message strings, so this is a non-issue.
- **Rollback**: Revert `workerpool` to `^9.2.0` in package.json, `npm install`, rebuild worker.
