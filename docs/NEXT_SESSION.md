# Next Session

## Exact Current Task

Start Phase 15 milestone 15.7: connect schema 10 native VFX to one canonical
evaluation-preparation path shared by viewport and visual exports. Milestones
15.1 through 15.6 are complete.

## Phase Ordering Evidence

- Phases 1-8: completed with documented limitations.
- Phases 9-12: `NOT_DEFINED / DEFERRED`; no authentic prompts or acceptance
  criteria exist in archives, attachments, docs, or Git.
- Phase 13: `DEFERRED / PARTIAL_SPEC`; only a summary exists.
- Phase 14: completed at `3a8487a`.
- Phase 15 is the lowest fully specified unfinished phase.

## Files To Inspect First

- `src/vfx/runtime/VfxFrameEvaluator.ts`
- `src/vfx/primitives/VfxPrimitiveEvaluator.ts`
- `src/vfx/compat/LegacyEffectAdapter.ts`
- `src/renderer/SceneRenderer.ts`
- `src/renderer/Viewport.tsx`
- `src/export/RenderCapture.ts`
- `src/rendering/export/OfflineFrameRenderer.ts`
- `src/export/renderQueue/ProductionRenderExecutor.ts`

## Completed Work

- Milestones 15.1-15.3 provide typed compatibility contracts, stateless seeded
  frame evaluation, and five bounded renderer-neutral primitives.
- Added one pure command controller over schema 9 `effects.instances`; no native
  collection, second store, second effects lane, or schema change exists.
- Added real insert/edit/move/trim/duplicate/copy/paste/enable/priority/delete
  operations, lane drag handles, selection, scrubbing, and disabled-state UI.
- Every successful non-no-op command regenerates one canonical effects lane and
  produces one whole-project history checkpoint. Failed/no-op commands do not.
- Added committed numeric/vector/color editing and save/export draft flushing.
- Canonicalized foreign lanes as bounded plain data and preserved their source
  position through save/reload and `.minemotion` packages.
- Added deterministic effect defaults and strict adversarial validation for
  sparse arrays, accessors, classes, duplicate IDs, non-finite values, unsafe
  ranges, malformed clipboards, and ambient entropy.
- New growth over 4,096 effect instances is rejected while oversized schema 9
  projects remain editable and repairable.
- Added legacy renderer guards: 64 active world effects, 4,096 burst particles
  per frame, 1,024 per effect, and one instanced mesh per glow burst.
- Milestone 15.4 validation: focused 8 files/96 tests, full 62 files/256 tests,
  typecheck/build/audit/diff checks green.
- Milestone 15.5 generates all five supported parameter-control kinds from the
  canonical schema and commits through the existing controller/history path.
- Bounds, defaults, integer semantics, enum options, safe colors, runtime
  support, and keyframe deferral are explicit. Invalid legacy values have a
  one-action default repair and unknown finite legacy keys are preserved.
- Full validation: 64 files/281 tests, typecheck, build, and audit green. Manual
  browser attachment remains environment-blocked.
- Milestone 15.6 inventories every persistence entry, migrates schemas 1-9 to
  schema 10, and persists synchronized native VFX without a second collection.
- Native seed, transform, target/bone, parameters/local keyframes, blend, layer,
  qualities, and version round-trip through JSON, package, autosave, and history.
- Corrupt/future native/project/package data and shared-field mismatches fail
  closed. Autosave preserves a previous payload; schema 9 rollback is lossless
  or rejected. Validation: focused 20 files/200 tests; full 65 files/298 tests.

## Unfinished Work

- Typed primitive evaluation is not yet the shared viewport/PNG/WebM/native
  export path; preview/export parity remains 15.7.
- Target resolution and complete renderer resource disposal remain 15.7/15.8.

## Known Error

Release Tauri build is blocked by Windows Smart App Control error 4551. Debug
MSI/NSIS succeeds. The in-app browser also failed to attach to the local webview
during the 15.4 manual smoke attempt; automated drag regressions pass.

## Next Command

```powershell
git status --short --branch; git log -4 --oneline
```

## Next Implementation Step

Map all current world/screen/camera effect rendering in viewport, Canvas capture,
PNG sequence, WebM, and FFmpeg staging. Introduce one deterministic preparation
result from schema 10 native instances, then adapt each consumer to it. Prove
same-frame parity and complete exclusion when `includeVfx=false`.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/renderer src/rendering src/export src/effects
npm test -- --run --reporter=dot
npm run build
npm audit --audit-level=high
```
