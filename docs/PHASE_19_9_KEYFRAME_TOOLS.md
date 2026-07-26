# Phase 19.9 - Keyframe Tools

## Status

COMPLETE

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

## Selected-range transforms

- Loop repeats the selected global frame range with deterministic key IDs,
  preserves the shared boundary without duplicate frames, and stops at the
  authoritative timeline duration.
- Reverse reflects selected frames inside their shared range, reverses
  directional easing, and rejects collisions with unselected keys atomically.
- Mirror reads one immutable snapshot before writing. It swaps supported
  left/right limb rotations and mirrors root position/rotation consistently
  with the renderer coordinate conventions.

All operations return ordinary authoritative global tracks and enter the
existing history exactly once only when data changes. No cleanup metadata,
secondary clip format, or persistent tool state was added.

## Validation

- Focused commands and persistence/production integration: 2 files, 9 tests.
- Full frontend suite: 110 files, 500 tests.
- Typecheck, localization, VFX examples, architecture, build, and audit pass.
- JSON, project packages, browser autosave, schema 9 compatibility, history,
  and production animation sampling preserve the transformed keys.
- `App.tsx` remains 2,678 lines.
