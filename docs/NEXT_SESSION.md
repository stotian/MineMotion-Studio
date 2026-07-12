# Next Session

## Exact Current Task

Start Phase 15 milestone 15.2: deterministic runtime and seeded frame
evaluation. Milestone 15.1 is implemented and validated.

## Phase Ordering Evidence

- Phases 1-8: completed with documented limitations.
- Phases 9-12: `NOT_DEFINED / DEFERRED`; no authentic prompts or acceptance
  criteria exist in archives, attachments, docs, or Git.
- Phase 13: `DEFERRED / PARTIAL_SPEC`; only a summary exists.
- Phase 14: completed at `3a8487a`.
- Phase 15 is the lowest fully specified unfinished phase.

## Files To Inspect First

- `src/vfx/core/VfxInstance.ts`
- `src/vfx/core/VfxEvaluationContext.ts`
- `src/vfx/core/VfxValidator.ts`
- `src/vfx/compat/LegacyEffectAdapter.ts`
- `src/core/ids/Id.ts`
- `src/core/time/FrameTime.ts`
- `src/core/services/EngineServices.ts`
- `src/effects/EffectTypes.ts`
- `src/renderer/SceneRenderer.ts`
- `src/export/RenderCapture.ts`

## Completed Work

- Defined typed VFX definitions, instances, parameter schemas, quality/context
  imports, validation, and immutable registry behavior.
- Added pure adapters for all existing definitions and every schema 9 instance
  field without changing `MineMotionProject`.
- Preserved the inclusive legacy end frame and derived stable compatibility
  seeds without wall-clock/random entropy.
- Guarded reverse conversion against schema 9 data loss.
- Added focused registry, validator, adapter, timing, structured-clone, and
  project round-trip tests.
- Full frontend validation: 54 files and 141 tests; typecheck/build/audit green.

## Unfinished Work

- No seeded PRNG, evaluator, resettable runtime state, or primitive output.
- No renderer, timeline, UI, project schema, or export consumer uses the typed
  VFX model yet.
- Preview/PNG/WebM parity and renderer resource leaks are tracked for 15.7/15.8.

## Known Error

Release Tauri build is blocked by Windows Smart App Control error 4551. Debug
MSI/NSIS succeeds. This does not block Phase 15.2 TypeScript work.

## Next Command

```powershell
git status --short --branch; git log -3 --oneline
```

## Next Implementation Step

Write deterministic PRNG test vectors and a pure evaluator contract first.
Evaluation must depend only on the instance plus explicit frame/FPS/seed/quality
inputs, reproduce identical output after scrub/reload/export, and avoid storing
GPU objects or mutable runtime state in project/history data.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx
npm test -- --run --reporter=dot
npm run build
npm audit --audit-level=high
```
