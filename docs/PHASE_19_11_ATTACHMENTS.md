# Phase 19.11 - Animated and Validated Attachments

## Status

COMPLETE

## Animation authority

Attachments remain ordinary character records bound to validated rig
attachment points. Their motion is derived from the point's parent bone after
the authoritative global animation tracks and NLA layers are sampled. No
attachment timeline, duplicated bone keys, or per-frame attachment state was
added.

A Three.js hierarchy regression proves that an attached item changes world
position with production-sampled forearm animation and remains finite.

## Validation and authoring

- Stable diagnostics cover duplicate/invalid IDs, unsupported kinds, invalid
  visibility, missing points/bones/assets, and the 32-item contract limit.
- Pure add/update/remove commands reject missing or locked characters, missing
  OBJ assets, unsupported points, limits, and no-op edits atomically.
- Rig Studio exposes visibility, point remapping, removal, and deterministic
  attachment of imported OBJ assets.
- Each successful action uses one existing whole-project history checkpoint.

## Rendering and persistence

The shared `SceneRenderer` now resolves `obj` attachments from the project asset
library instead of rendering the generic item cube. Missing assets retain a
safe fallback plus a visible validation diagnostic. The same renderer path is
used by preview and offline output.

JSON, project packages, browser autosave, schema 9, history, and production
sampling preserve valid attachments and their parent-bone behavior.

## Validation

- Focused attachment/runtime/persistence tests: 3 files, 7 tests.
- Full frontend suite: 113 files, 511 tests.
- Typecheck, localization, VFX examples, architecture, build, and audit pass.
- Build: 1,860 modules; known 1,482.88 kB large chunk.
- `App.tsx` remains below the Phase 19 baseline at 2,676 lines.
