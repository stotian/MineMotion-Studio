# Phase 19.4 - Foot Lock and Ground Placement

## Scope

Phase 19.4 reduces visible planted-foot drift without adding persistent
constraint state or a second animation timeline. It derives bounded session
inputs, samples existing terrain data deterministically, and bakes final leg
rotations into the authoritative global `bone.rotation.*` tracks.

## Ground sampling contract

- Preset terrain generation is now renderer-neutral in `TerrainPreset.ts`.
- Imported chunks take precedence when embedded block data exists.
- Imported blocks use Minecraft integer cell origins; preset blocks use the
  renderer's integer-centered cubes.
- Air and water do not support feet. Other currently rendered cubes do.
- Queries choose the highest support inside bounded rise/drop limits and fail
  explicitly for missing or invalid ground.
- The sampler is derived at runtime and is never serialized.

## Foot lock sample contract

A lock anchor records one left/right foot world position, an inclusive bounded
frame range, and the sampled ground height. Every in-range sample reuses the
same world target and reports the correction and prevented horizontal slide.
Outside the range the natural sample passes through unchanged.

## Completed bake path

- Forward kinematics matches the rendered Three.js hierarchy for character
  transform, root rotation, upper leg, and lower leg.
- Each frame samples the existing animation timeline, converts the fixed world
  anchor into parent-local IK space, and requires an exact reachable solve.
- A successful inclusive range writes two global leg tracks and commits once.
- Missing ground, invalid transforms, locked characters, oversized ranges, and
  unreachable frames return the original project without partial keys.
- Repeating an identical bake is a no-op; history, serialization, timeline
  synchronization, preview, and export continue through existing paths.
- Rig Studio exposes bounded start/end/ground-offset inputs only for foot
  controls, with English/French coverage.

Phase 19.4 is complete. Viewport foot gizmos remain part of the honest future
gizmo limitation rather than being implied by this numeric range workflow.
