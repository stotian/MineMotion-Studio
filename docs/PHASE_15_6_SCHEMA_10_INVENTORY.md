# Phase 15.6 - Schema 10 Persistence Inventory

Status: COMPLETED - inventory recorded before implementation and validated
against the finished schema 10 migration.

## Requirements And Invariants

- Migrate schemas 1-9 to 10 without changing legacy effect identity, inclusive
  timing, enabled state, target, position, or representable parameters.
- Persist the native VFX serialization version, definition, transform, target
  including bone, seed, parameters/local-frame keyframes, blend, render layer,
  and preview/export qualities as finite structured-cloneable data.
- Keep one `effects.instances` authority and one derived effects timeline lane.
- Preserve the legacy renderer projection until typed preview/export parity is
  complete in 15.7.
- Reject missing/corrupt schema 10 native data and future project, package, or
  VFX serialization versions. Migration never overwrites the source payload.
- Provide an explicit schema 9 rollback/export only when native data is
  representable without loss.

## Schemas 1-9

| Version | Added data | Current migration owner |
| ---: | --- | --- |
| 1 | Core project/scene/animation/assets | `ProjectSerializer` legacy core guard |
| 2 | Project settings | v1 compatibility defaults |
| 3 | Camera/effects/audio/post/render/timeline lanes | current defaults + sanitizers |
| 4 | Package metadata, asset library, export/performance | current defaults + package modules |
| 5 | Minecraft world/chunk cache | world defaults |
| 6 | Rigs, skins, attachments, bone animation, Blockbench | rig sanitizers |
| 7 | Resource packs, materials, lighting/environment | resource/lighting sanitizers |
| 8 | Keyframe IDs/interpolation, markers, clips, NLA | animation parsers/defaults |
| 9 | FFmpeg settings and persisted render queue | FFmpeg/render-queue sanitizers |

## Persistence Path Inventory

```text
new project / template / history
              |
              v
       MineMotionProject
        |      |       |
        |      |       +--> render queue package export
        |      +----------> browser autosave + backup
        +-----------------> .minemotion package writer
        +-----------------> schema 9 .mmsproj rollback export
                               |
project JSON / autosave / package reader
                               v
                       ProjectSerializer.parse
                               |
                         schemas 1-9 -> 10
```

- New project and templates: `ProjectStore` and template registry.
- Canonical JSON: `ProjectSerializer.serialize/parse`.
- Autosave: App `localStorage` key `minemotion.autosave.project.v1`; Phase 15.6
  adds a recoverable previous-payload backup instead of deleting failed data.
- `.mmsproj`: explicit lossless schema 9 export; current/schema 10 JSON remains
  loadable through `ProjectSerializer`.
- `.minemotion`: `PackageWriter` -> `createMineMotionPackageData` -> manifest;
  `PackageReader` validates the package then delegates project migration.
- Production package export: `ProductionRenderExecutor` delegates to the same
  package writer.
- History/undo/redo: whole-project `structuredClone`; no separate serializer.
- PNG/sequence/WebM/FFmpeg frame staging reads the in-memory project and does
  not persist a second project payload.

## Architecture Options

### A. Add `project.vfx.instances` beside `effects.instances` (1-2 days)

Pros: native shape is immediately visible. Cons: two persisted authorities can
drift across timeline, history, autosave, package, preview, and export. Rejected.

### B. Replace `effects.instances` with `VfxInstance[]` now (3-5 days)

Pros: native model is immediately canonical. Cons: every current Inspector,
timeline, renderer, package, and export consumer would need the 15.7 runtime
migration in the same risky schema change. Rejected for this milestone.

### C. Enrich each existing instance with a synchronized native record (1-3 days)

```text
effects.instances[i]
  legacy projection  <--- shared-field synchronization --->  nativeVfx v1
         |                                                   |
 current UI/renderer                                  future typed runtime
```

Pros: one collection/lane/history record, deterministic v9 migration, current
behavior preserved, native-only fields become losslessly serializable. Cons:
shared fields coexist temporarily and must be synchronized until 15.7 removes
the legacy runtime dependency. Selected.

## Failure Handling

- Parsing and migration are pure with respect to the source string.
- Schema 10 missing/invalid native records fail closed with a precise error.
- Autosave writes retain the previous payload as a backup; a corrupt primary
  can recover from it and neither payload is silently deleted on failure.
- Schema 9 export validates native-to-legacy conversion and rejects rotation,
  scale, bone targets, custom seed/quality/layer/blend, or parameter keyframes
  instead of dropping them.
- Package manifest schema remains 1 and records project schema 10; future
  package/project/native versions remain rejected independently.

## ADR

Title: Migrate schema 10 through one enriched effects collection
Status: Accepted
Context: Native-only VFX fields must persist before the renderer/UI transition,
while all current behavior still consumes the legacy effect projection.
Decision: Keep `effects.instances` as the sole collection and attach one
validated `nativeVfx` record to each legacy projection. Synchronize overlapping
fields from current edits while preserving native-only values. Migrate schemas
1-9 deterministically and allow lossless schema 9 rollback export.
Consequences: schema 10 safely unlocks native persistence without a parallel
store. A temporary shared-field bridge remains until 15.7 makes typed VFX the
runtime path; corruption and lossy rollback fail explicitly.
