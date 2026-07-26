# Phase 19.10 - Pose Tools

## Status

COMPLETE

## Existing behavior retained

- Built-in and saved poses still apply through the existing rig pose library.
- Saving a named pose still writes the bounded `rigs.savedPoses` collection.
- Renderer-consistent left/right mirror and rig-default reset remain available.

## Added workflow

- Copy captures a detached complete snapshot of the selected rig's supported
  current bone rotations.
- The clipboard is session-only and never enters project schema, autosave,
  packages, migration, timeline, or export data.
- Paste applies compatible bone IDs to the target character.
- Blend linearly applies the copied pose at a bounded 0-100% influence.
- Locked or missing targets, empty clipboards, invalid influence, and no-op
  results fail without changing the project or creating history.

Paste, blend, mirror, reset, and preset application each commit at most one
whole-project history checkpoint. The dedicated pose UI is extracted from
`RigStudioPanel`, and `App.tsx` is reduced by grouping callbacks in one pose
workspace.

## Validation

- Focused pose command/library/persistence tests: 3 files, 9 tests.
- Full frontend suite: 111 files, 505 tests.
- Typecheck, localization, VFX examples, architecture, build, and audit pass.
- JSON, project packages, browser autosave, schema 9, history, and production
  sampling preserve applied poses.
- `App.tsx` is 2,675 lines.
