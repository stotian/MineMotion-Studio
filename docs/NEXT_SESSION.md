# Next Session

## Exact Current Task

Start Phase 15 milestone 15.3: reusable native VFX primitives. Milestones
15.1 and 15.2 are implemented and validated.

## Phase Ordering Evidence

- Phases 1-8: completed with documented limitations.
- Phases 9-12: `NOT_DEFINED / DEFERRED`; no authentic prompts or acceptance
  criteria exist in archives, attachments, docs, or Git.
- Phase 13: `DEFERRED / PARTIAL_SPEC`; only a summary exists.
- Phase 14: completed at `3a8487a`.
- Phase 15 is the lowest fully specified unfinished phase.

## Files To Inspect First

- `src/vfx/runtime/VfxFrameEvaluator.ts`
- `src/core/random/DeterministicRandom.ts`
- `src/vfx/core/VfxDefinition.ts`
- `src/vfx/core/VfxParameterSchema.ts`
- `src/vfx/compat/LegacyEffectAdapter.ts`
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
- Milestone 15.1 validation: 54 files and 141 tests; typecheck/build/audit green.
- Added fixed compatible hash vectors, versioned typed seed derivation, and a
  counter-addressed random sampler with no mutable generator state.
- Added pure frame evaluation with full validation, explicit inactivity,
  inclusive timing, resolved defaults, cloned primitive inputs, and four
  deterministic quality scales.
- Proved repeat/step/scrub/order/clone/JSON/schema 9 reload equivalence and
  blocked ambient random, UUID, crypto, and clock sources in focused tests.
- Current validation: 56 files and 160 tests; typecheck/build/audit green.

## Unfinished Work

- No native particle, mesh/sprite, trail, beam/lightning, ring, overlay, camera,
  or light-pulse primitive descriptors/evaluators.
- No renderer, timeline, UI, project schema, or export consumer uses the typed
  VFX model yet.
- Preview/PNG/WebM parity and renderer resource leaks are tracked for 15.7/15.8.

## Known Error

Release Tauri build is blocked by Windows Smart App Control error 4551. Debug
MSI/NSIS succeeds. This does not block Phase 15.3 TypeScript work.

## Next Command

```powershell
git status --short --branch; git log -3 --oneline
```

## Next Implementation Step

Define a discriminated primitive descriptor union and hard caps first. Implement
at least five reusable pure primitives from the master prompt, driven only by
the 15.2 active frame descriptor and semantic sample indices. Do not create
Three.js objects or connect preview/export until the primitive data is bounded,
deterministic, cloneable, and tested.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx
npm test -- --run --reporter=dot
npm run build
npm audit --audit-level=high
```
