# Phase 19.6 - Motion Paths

## Status

COMPLETE

## Pure sampling checkpoint

The first Phase 19.6 checkpoint adds one bounded renderer-neutral motion-path
contract for:

- character root;
- left and right hand attachment points;
- production scene cameras.

Requests use an inclusive timeline range. The sampler returns ordered points,
exact keyframe-point flags, frame/second duration, traveled distance, and world
bounds. Integer frame samples are augmented by fractional relevant keyframes.

Camera paths sample the existing `transform.position` track. Character points
sample existing transform and required `bone.rotation.*` tracks, then evaluate
the real rig hierarchy through shared pure space math. A Three.js regression
proves the right-hand point matches the rendered attachment hierarchy under
animated root/body/arm/forearm rotations and non-uniform character scale.

Relevant tracks are bounded and sorted once; sampling uses binary search plus
the existing interpolation curves. The contract does not repeatedly clone the
whole project through `Animator`, add project fields, or allocate Three.js data.

## Viewport integration

- Rig Studio selects character root, left/right hand, or camera path.
- Inclusive start/end and visibility controls remain outside project data.
- Duration in frames/seconds, distance, samples, and key count update from the
  derived path.
- The viewport owns one colored polyline and exact white keyframe points under
  the disposable scene root.
- Render preview and every export frame exclude the editor-only overlay.
- Changing only `currentFrame` does not recompute a whole path; memoization is
  keyed to scene entities, authoritative tracks, duration, and FPS.

Direct path editing is an optional criterion and remains deferred. It must reuse
existing keyframe commands before it can be enabled; no path-specific key store
or timeline was added.

## Validation

- Focused sampler/renderer/disposal tests: 3 files, 8 tests.
- Full frontend suite: 105 files, 473 tests.
- Typecheck, locales, VFX examples, architecture, build, and audit pass.
