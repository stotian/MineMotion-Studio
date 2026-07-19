# Next Session

## Exact Current Task

Start Phase 15 milestone 15.8: measure and bound global VFX work, then make
renderer resource ownership and disposal explicit. Milestones 15.1 through
15.7 are complete.

## Phase Ordering Evidence

- Phase 14 is complete.
- Phase 15 is the lowest fully specified unfinished phase.
- The completion pack assigns budgets, disposal, and repeat lifecycle tests
  immediately after native preview/export integration.

## Files To Inspect First

- `src/renderer/SceneRenderer.ts`
- `src/vfx/primitives/VfxPrimitiveTypes.ts`
- `src/vfx/primitives/VfxPrimitiveEvaluator.ts`
- `src/vfx/runtime/VfxProjectFrame.ts`
- `src/export/video/WebMRecorder.ts`
- `src/export/renderQueue/ProductionRenderExecutor.ts`

## Completed Work

- Milestones 15.1-15.6: typed model, deterministic evaluation/primitives,
  editing/Inspector, and schema 10 native persistence.
- Milestone 15.7 inventories all visual consumers and introduces one canonical
  schema 10 prepared-frame contract used by Three.js, React overlays,
  PNG/sequence, composited WebM, and FFmpeg staging.
- Local parameter keyframes evaluate deterministically. Entity/bone targets
  resolve safely with warnings. Known visual presets remain compatibility maps.
- Final-camera render state carries/restores export settings, so
  `includeVfx=false` removes all VFX before canvas capture.
- Validation: focused 6 files/34 tests; full 67 files/307 tests;
  typecheck/build/audit green. Browser smoke remains environment-blocked.

## Unfinished Work

- Global per-frame effect/particle/segment/stack budgets need measurement and
  enforcement before allocation.
- `SceneRenderer` clears/rebuilds roots without recursively disposing all
  geometries, materials, textures, and VFX roots.
- Repeat add/remove/reopen/export/retry/cancel lifecycle tests and diagnostics
  remain milestone 15.8.
- Full Phase 15.9 stabilization follows 15.8.

## Next Command

```powershell
git status --short --branch; git log -4 --oneline
```

## Next Implementation Step

Characterize current SceneRenderer rebuild/disposal and primitive allocation
counts. Define measured global budgets shared by prepared stacks, add recursive
Three.js disposal with ownership tests, then exercise repeat project/export and
cancellation cycles without changing visible output.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/renderer src/export src/rendering
npm test
npm run build
npm audit --audit-level=high
```
