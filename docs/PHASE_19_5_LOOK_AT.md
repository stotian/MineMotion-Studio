# Phase 19.5 - Look-at Constraints

## Status

COMPLETE

## Implemented

Phase 19.5 defines one renderer-neutral solve and connects it to the production
timeline for head bones, cameras, and imported scene objects.

- Source, target, current rotation, up direction, limits, influence, and Euler
  order are explicit bounded inputs.
- Local `-Z` is the single forward-axis convention.
- `XYZ` matches scene object and rig rendering; `YXZ` matches the production
  camera controller.
- A world-up basis produces a zero-roll target when possible. Vertical targets
  use a deterministic fallback.
- Influence uses shortest-path quaternion interpolation before component limits.
- The result reports ideal/final rotations, requested/evaluated directions,
  clamping, reach state, and stable warnings.
- Plain-data/accessor and non-finite hostile inputs fail without side effects.
- Head mapping converts animated world targets through character transform,
  root, and body into the exact head-parent space, including non-uniform scale.
- Camera and object mapping samples their world positions and existing rotations;
  a selected target entity is sampled at the current timeline frame.
- Rig Studio exposes live enable, target entity/custom world position, influence,
  symmetric maximum angles, current frame, and bake controls in English/French.
- Preview is derived session state. A successful bake writes one existing
  `bone.rotation.head` or `transform.rotation` track and one history checkpoint.
- Head compatibility `boneKeyframes`, schema 10, guarded schema 9, serializer,
  timeline sampling, undo, and redo stay on their existing paths.
- A repeated identical bake is a no-op; disabled, locked, missing, malformed, or
  out-of-range operations leave the original project untouched.
- Eye direction follows the head and is disclosed as a placeholder rather than
  adding premature expression-overlay data.

No serialized constraint record, new animation authority, parallel timeline, or
per-frame history entry was introduced.

## Validation

- Focused look-at/timeline/foot-space tests: 5 files, 19 tests.
- Full frontend suite: 103 files, 467 tests.
- Typecheck, locales, VFX examples, architecture, build, and audit pass.
- `App.tsx` remains 2,678 lines, unchanged from the Phase 19.4 baseline.
