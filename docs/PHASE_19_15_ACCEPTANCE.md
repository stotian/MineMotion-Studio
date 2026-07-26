# Phase 19.15 - Advanced Rigging Acceptance Gate

## Status

COMPLETE

## Evidence matrix

| Area | Detailed evidence | Cross-system result |
| --- | --- | --- |
| Rig contract and migration | `RigContract`, `RigSerializer`, `RigPersistenceIntegration` | Global bone tracks remain authoritative; schema 9 and schema 10 reopen safely |
| IK and foot lock | `TwoBoneIK`, `RigIKController`, `FootKinematics`, `FootLockBakeController` | Production tracks, atomic history, grounded ranges, and hostile inputs covered |
| Constraints and paths | `LookAtController`, `LookAtMapping`, `MotionPathSampler` | Preview/bake conventions and production sampling match |
| Layers and procedural motion | `ProjectAnimationLayerEvaluator`, `ProceduralAnimationController` | Existing NLA/global timelines, packages, autosave, and sampling covered |
| Keyframe and pose tools | `KeyframeCommands`, `PoseCommands` | Selection operations and pose edits are immutable, bounded, and atomic |
| Attachments and expressions | `AttachmentController`, `AttachmentRuntime`, `ExpressionOverlay` | Shared rig rendering and every persistence boundary covered |
| Blockbench | `BbmodelParser`, `BlockbenchAssetContract`, `BlockbenchMapping` | Bounded import, manual mapping, converted clips, and persistence covered |
| Final composite | `Phase19Acceptance` | Expression + attachment + bone track cross save/migration/history/timeline/preview/export seams |

## Composite gate

The final fixture combines a visible right-hand attachment, an optional
expression overlay, and an animated forearm track. It verifies:

- JSON save/reopen;
- guarded schema 9 migration;
- project package and browser autosave;
- undo and redo;
- canonical rig timeline items;
- production animation sampling;
- shared character-rig preview construction; and
- final-camera export-frame preparation with an equal sampled rig result.

The automated gate does not claim a manual browser visual pass. The existing
browser bootstrap remains environment-blocked before attachment by
`Cannot redefine property: process`.

## Final validation

- Composite acceptance: 1 file, 2 tests.
- Full frontend suite: 117 files, 526 tests.
- Typecheck, localization, VFX examples, architecture, build, and audit pass.
- Build: 1,871 modules; known 1,516.64 kB large chunk.
- `App.tsx`: 2,674/2,839 lines.
- Native checks were not rerun because the final gate changes frontend tests and
  documentation only.

Phase 19 acceptance criteria are satisfied at the documented automated scope.
Phase 20 begins with measurement, budgets, and reproducible benchmarks rather
than speculative optimization.
