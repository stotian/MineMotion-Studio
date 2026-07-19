# Next Session

## Exact Current Task

Start Phase 15 milestone 15.9: complete the final VFX stabilization audit and
gate. Milestones 15.1 through 15.8 are complete.

## Phase Ordering Evidence

- Phase 14 is complete.
- Phase 15 is the lowest fully specified unfinished phase.
- The completion pack assigns controller characterization, visual smoke, and
  the complete stabilization gate after budgets/resource lifecycle work.

## Files To Inspect First

- `src/effects/EffectTimelineController.ts`
- `src/vfx/runtime/VfxProjectFrame.ts`
- `src/renderer/SceneRenderer.ts`
- `docs/KNOWN_LIMITATIONS.md`
- active Phase 15 completion-pack file

## Completed Work

- Milestones 15.1-15.7: typed model, deterministic evaluation/primitives,
  editing/Inspector, schema 10 persistence, and shared preview/export.
- Milestone 15.8: deterministic global 64-effect/4,096-particle/8,192-segment/
  10,000-work-unit caps before allocation, with structured diagnostics.
- Scene rebuild/shutdown recursively disposes owned Three.js resources without
  invalidating explicit material/skin caches. WebM cleans bitmaps, tracks, and
  listeners on success, retry, cancellation, startup failure, and error.
- Repeated add/remove/reopen retains native VFX identity and leaves no stale
  project effects.
- Validation: focused 21 files/115 tests; full 70 files/317 tests;
  typecheck/build/audit green.

## Unfinished Work

- Audit oversized Phase 15 controllers; split only with characterization tests
  and a concrete ownership benefit.
- Retry one real visual smoke pass and record environment limitations honestly.
- Run the final Phase 15.9 stabilization gate and close/handoff Phase 15.

## Next Command

```powershell
git status --short --branch; git log -4 --oneline
```

## Next Implementation Step

Characterize the public command behavior and internal ownership of
`EffectTimelineController.ts`. Decide from evidence whether a focused extraction
is warranted; do not change behavior merely to reduce line count.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/effects src/vfx src/renderer src/export src/project
npm test
npm run build
npm audit --audit-level=high
```
