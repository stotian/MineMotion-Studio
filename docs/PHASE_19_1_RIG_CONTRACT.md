# Phase 19.1 - Rig Contract and Persistence Consolidation

## Inventory result

MineMotion Studio already had Steve/Alex and placeholder mob definitions, core
bone transforms, attachment points, saved poses, Blockbench summary assets, rig
timeline items, and a registered but deliberately unsolved IK placeholder.

Bone animation had two serialized representations: global
`animation.tracks` drives `Animator` and production sampling, while
`character.boneKeyframes` was written by Rig Studio but never reconciled during
load. Attachments, rotations, poses, and definitions also lacked one bounded
validation contract.

## Implemented authority

- `RIG_CONTRACT_VERSION = 1` and explicit limits cover existing definitions,
  bones, attachments, poses, tracks, keyframes, IDs, text, and frames.
- All checked-in rig definitions validate parent/mirror references, hierarchy
  cycles, unique IDs, finite vectors, and attachment bones.
- Character rotations repair non-finite vectors, preserve bounded compatible
  unknown bone IDs, and sanitize attachment kinds/points/OBJ references.
- Saved poses are bounded and sanitized at serializer boundaries.
- Global `animation.tracks` is authoritative. Legacy per-character frames fill
  only missing global frames; the global value wins conflicts. The legacy array
  is regenerated from the consolidated timeline.
- Schema 10 is unchanged. No IK, constraint, animation-layer, or procedural
  parallel authority was introduced.

## Evidence

Focused validation passes 7 files / 35 tests. It covers catalog validation,
hostile vectors/attachments, legacy migration, conflict precedence, Animator
sampling, rig lane generation, JSON, schema 9, project packages, autosave,
history, poses, and attachments. The full gate passes 90 files / 401 tests,
typecheck, a 1,824-module production build, and audit with zero vulnerabilities.
