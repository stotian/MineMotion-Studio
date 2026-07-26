# Phase 19.8 - Procedural Animation

## Status

IN_PROGRESS

## Contract and idle checkpoint

The renderer-neutral procedural contract defines ten closed generator kinds:
idle, walk, run, crouch, jump, landing, recoil, hit reaction, sword swing, and
turn. Inputs are versioned bounded plain data:

- duration: 4-480 frames;
- intensity: 0-2;
- cycles: 1-8 and additionally bounded by duration;
- direction: left or right.

Generation is deterministic and allocates at most 65 keys per track with
rotations bounded to 180 degrees. Invalid versions and accessor-bearing objects
fail without invocation. Generator settings remain session controls rather than
new project state.

The first available generator creates a looping idle-breathing clip for body,
head, and both arms. One Rig Studio action:

1. creates or updates one reusable deterministic clip;
2. bakes its global `bone.rotation.*` tracks at the playhead;
3. extends the timeline when necessary;
4. synchronizes the existing rig lane;
5. commits the complete result through one history operation.

Generated keys use normal interpolation and are immediately editable in the
Dopesheet/Graph/timeline. Repeating the same generation replaces keys at equal
frames and does not duplicate either the clip or frame keys.

## Remaining

- add walk, run, and crouch-walk locomotion recipes;
- add jump, landing, recoil, hit-reaction, sword-swing, and turn recipes;
- expose direction only for recipes that use it;
- complete persistence/export regression coverage for all generator kinds.

## Validation

- Focused procedural/clip tests: 3 files, 9 tests.
- Full frontend suite: 109 files, 490 tests.
- Typecheck, localization, architecture, build, and audit pass.
- `App.tsx` remains 2,678 lines.
