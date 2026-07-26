# Phase 19.14 - Optional Minecraft Expression Overlays

## Status

COMPLETE

## Contract

A character may store one optional expression with:

- one of blink, anger, sadness, confidence, surprise, or fear;
- a finite intensity clamped to 0-1; and
- an enabled literal that fails closed when missing or invalid.

Missing, disabled, invalid, and zero-intensity settings produce no descriptors
and no renderer objects. Existing projects and ordinary Steve/Alex skins retain
their previous geometry/material path by default.

## Rendering

Pure expression resolution creates at most five immutable pixel-bar
descriptors. The shared character rig renderer attaches owned thin boxes above
the head face, marks their three shared materials as cache-owned, and excludes
the overlay meshes from selection raycasts.

Because both interactive preview and offline export use the same rig renderer,
there is no expression-specific render path.

## Editing and persistence

Rig Studio exposes localized enable, preset, intensity, and Apply controls.
Preset/intensity edits remain local draft state until Apply, preventing one
undo entry for every slider event. Enable, disable, and Apply use one atomic
whole-project command and reject missing, locked, or unchanged targets.

Expressions survive JSON, schema 9, project packages, autosave, and history.
They are deliberately static character settings; Phase 19.14 adds no parallel
timeline or discrete expression-keyframe contract.

## Validation

- Focused expression/rig/project persistence tests: 3 files, 22 tests.
- Full frontend suite: 116 files, 524 tests.
- Typecheck, localization, VFX examples, architecture, build, and audit pass.
- Build: 1,871 modules; known 1,516.64 kB large chunk.
- `App.tsx` decreased to 2,674 lines.
