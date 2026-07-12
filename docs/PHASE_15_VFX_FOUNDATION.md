# Phase 15 - Native Deterministic VFX Foundation

Phase status: IN_PROGRESS
Milestone 15.1 status: COMPLETED - typed model and schema 9 compatibility projection
Next milestone after checkpoint: 15.2 - deterministic runtime

## Requirements And Boundaries

Phase 15 must make VFX deterministic and first-class without replacing the
working project, timeline, renderer, history, or export paths. Schema 9
`effects.instances` and `track_effects_main` remain authoritative until a
schema 10 migration is designed and tested.

The current milestone adds pure typed contracts, definition/instance
validation, a derived registry view, and a reversible legacy adapter. It does
not claim a deterministic runtime, native primitives, inspector generation, or
preview/export parity yet.

Non-functional requirements:

- explicit frame, FPS, seed, and quality inputs;
- structured-cloneable instance data for undo/redo;
- no uncontrolled render randomness;
- no project schema change or duplicate timeline lane;
- unknown legacy parameters are preserved and reported;
- lossy conversion back to schema 9 is rejected;
- no GPU/runtime resource ownership in serialized contracts.

## Existing Integration Surface

- project data: `src/project/ProjectFile.ts` and `ProjectSerializer.ts`
- legacy definitions/instances: `src/effects/`
- timeline: `track_effects_main` through `CinematicTimeline.ts`
- undo/redo: whole-project structured clones through `commitProject`
- preview: `SceneRenderer.ts` plus DOM overlays in `Viewport.tsx`
- offline PNG: `src/export/RenderCapture.ts`
- production dispatch: `src/export/renderQueue/ProductionRenderExecutor.ts`
- plugin metadata: `src/plugins/PluginAPI.ts`

## Architecture Options

### A. Alias the legacy types (about 2-4 hours)

```text
EffectInstance ---> VfxInstance type alias ---> future runtime
```

Pros: almost no migration risk.
Cons: cannot model seed, quality, transform, layer, blending, or target bones;
validation remains weak.

### B. Extend `EffectInstance` in place (about 1-3 days)

```text
schema 9 JSON <--> expanded EffectInstance <--> every current consumer
```

Pros: one runtime shape immediately.
Cons: silently changes the effective schema, touches every consumer, and can
lose fields when old files are saved.

### C. Pure compatibility projection (selected, about 4-8 hours)

```text
schema 9 effects.instances
          |
          | pure non-mutating adapter
          v
    typed VfxInstance[] ---> registry + validator ---> future runtime
```

Pros: keeps current files, lane, UI, preview, export, autosave, packages, and
history stable while allowing the target model to be expressed and tested.
Cons: two type vocabularies coexist temporarily, and new-only fields cannot be
saved until schema 10.

## Milestones

1. **15.1 Model and compatibility** - typed definitions/instances/parameters,
   registry, validator, deterministic compatibility seed, legacy round-trip.
2. **15.2 Deterministic runtime** - seeded frame evaluator, reset/seek behavior,
   runtime state and deterministic tests.
3. **15.3 Native primitives** - at least five reusable primitives with hard
   limits and explicit ownership.
4. **15.4 Timeline integration** - reuse the effects lane; blocks, trim,
   duplicate, parameter animation, and scrubbing.
5. **15.5 Inspector and schemas** - generate real controls from parameter
   schemas and connect edits through project history.
6. **15.6 Serialization and migration** - schema 10 design, migration,
   round-trip/package/autosave tests, and rollback behavior.
7. **15.7 Preview and export** - one evaluation path for viewport, PNG, WebM,
   and native export with honest capability gates.
8. **15.8 Performance and cleanup** - pooling, caps, object-tree disposal,
   cancellation, diagnostics, and leak tests.
9. **15.9 Phase validation** - full acceptance review, docs, manual checks,
   install/typecheck/tests/build/audit/native validation as applicable.

## Milestone 15.1 Acceptance

- all nine legacy instance fields and every parameter key round-trip unchanged;
- all 12 built-in definition IDs, spaces, durations, defaults, and tags adapt
  from the existing registry rather than a copied preset dataset;
- timing remains inclusive at `startFrame + durationFrames`;
- compatibility seeds are stable and never use wall-clock or random entropy;
- registry rejects invalid or duplicate definitions;
- validator catches invalid IDs, timing, transforms, seeds, quality, parameter
  types/ranges, and missing definitions;
- unknown primitive legacy parameters are warned about and preserved;
- rotation, scale, bone, custom seed/quality/layer/blend changes are rejected
  when converting to schema 9;
- schema version remains 9 and the existing project/timeline/render/UI paths
  are unchanged;
- focused tests, full tests, typecheck, build, audit, and diff checks pass.

## Risks And Deferred Repairs

- `SceneRenderer.sceneRoot.clear()` detaches recreated effect geometry and
  materials without complete disposal. Target: 15.8.
- preview, PNG, and WebM currently render different subsets of effects and
  `includeVfx` cannot remove world VFX already present in the canvas. Target:
  15.7.
- `targetObjectId` is serialized but not evaluated. Target: 15.2/15.4.
- several legacy parameters are defined but ignored by render paths. Target:
  15.3/15.5/15.7.
- schema 10, independent persisted seeds, target bones, transform, quality,
  blend mode, and render layer remain deliberately unsaved in 15.1.

## Architecture Decision

Title: Preserve schema 9 through a pure legacy-to-VFX projection
Status: Accepted for milestone 15.1
Context: The target VFX model contains data schema 9 cannot represent while
current project, timeline, UI, preview, package, export, and history paths are
functional.
Decision: Keep legacy effects authoritative, derive typed VFX definitions and
instances through pure adapters, validate them, and reject lossy reverse
conversion.
Consequences: current projects remain safe and no competing store/lane is
introduced; runtime consumers migrate incrementally, while new-only VFX fields
must wait for a tested schema 10 migration.

## Milestone 15.1 Validation Record

- Schema impact: none; `CURRENT_PROJECT_SCHEMA_VERSION` remains 9.
- Project round-trip: PASS, including every legacy effect field.
- Focused tests: PASS - 6 files, 43 tests.
- Typecheck: PASS.
- Full tests: PASS - 54 files, 141 tests.
- Build: PASS - 1,759 modules; existing large-chunk warning remains.
- Audit: PASS - 0 vulnerabilities.
- Native/Tauri validation: not run; no Rust or native configuration changed.
- Manual visual validation: not required for this data-contract-only milestone.
