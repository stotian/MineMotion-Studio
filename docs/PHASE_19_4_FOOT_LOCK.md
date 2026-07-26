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

This first checkpoint intentionally adds no UI and writes no keyframes. The next
checkpoint must evaluate character/leg forward kinematics, convert the fixed
world anchor to the existing local two-bone IK contract at every frame, and
commit the whole bake as one history operation.
