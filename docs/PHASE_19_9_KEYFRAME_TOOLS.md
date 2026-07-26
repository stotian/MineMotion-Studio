# Phase 19.9 - Keyframe Tools

## Status

IN_PROGRESS

## Cleanup checkpoint

The existing Dopesheet selection now drives three bounded atomic cleanup
commands:

- redundant-key removal deletes only selected interior linear keys that match
  the value interpolated between their current neighbors;
- noise reduction removes selected interior keys within a user-controlled
  0-180 degree component tolerance, including non-linear source segments as an
  explicit approximation;
- smoothing blends selected interior values halfway toward the time-weighted
  interpolation of their neighbors without moving frames or endpoints.

Cleanup iterates over the current reduced neighbors, so removing adjacent keys
does not silently compound error against stale source neighbors. Removed keys
are also removed from Dopesheet selection. No-op commands retain the original
track reference and do not create history entries.

Existing timing scale commands already provide selected-key retime, and IK,
foot lock, and look-at already bake constraints through their production
controllers.

## Remaining

- loop a selected animation range;
- reverse selected timing;
- mirror selected rig/transform animation;
- validate save/load, history, timeline, preview, and export for all operations.

## Validation

- Focused keyframe commands: 1 file, 5 tests.
- Full frontend suite: 109 files, 496 tests.
- Typecheck, localization, architecture, build, and audit pass.
- `App.tsx` remains 2,678 lines.
