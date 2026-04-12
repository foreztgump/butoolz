# Wrap-Up: TEE-87 chore(deps): upgrade TypeScript 5 → 6

## Checklist
- [x] CodeRabbit clean
- [x] OpenSpec verified
- [x] Docs updated (CHANGELOG.md)
- [x] Committed and pushed
- [x] PR open: https://github.com/foreztgump/butoolz/pull/15
- [x] OpenSpec archived
- [x] Linear updated (In Review)
- [x] OpenMemory saved
- [x] PR merged
- [x] Branch deleted: feat/tee-87-upgrade-typescript-6
- [x] Worktree removed: /home/cownose/projects/butoolz-tee-87-upgrade-typescript-6

## Spec Deviations
- `types` set to `["jest"]` instead of `[]` — preserves IDE type-checking for test files
- `tsconfig.test.json` uses `ignoreDeprecations: "6.0"` — scoped to Jest only, caused by ts-jest forcing moduleResolution=node10

## Follow-Up Items
- Monitor ts-jest for native TS6 support — when available, remove `ignoreDeprecations` from `tsconfig.test.json`
- Consider upgrading to TypeScript 7.0 (Go-based native port) when it ships (late 2026 / early 2027)
