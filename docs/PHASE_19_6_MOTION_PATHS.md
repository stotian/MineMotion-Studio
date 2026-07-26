# Phase 19.6 - Motion Paths

## Status

IN_PROGRESS

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

## Remaining

- session controls for subject, range, and visibility;
- viewport polyline and keyframe-point rendering with correct disposal;
- root/hand/camera selection integration and duration display;
- optional path editing only if it can reuse existing keyframe commands without
  adding another timeline authority.

## Validation

- Focused motion-path/interpolation tests: 2 files, 6 tests.
- Full frontend suite: 104 files, 471 tests.
- Typecheck, locales, VFX examples, architecture, build, and audit pass.
