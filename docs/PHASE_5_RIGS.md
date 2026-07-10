# Phase 5: Minecraft Rigs, Skins, Poses, Blockbench

Phase 5 turns MineMotion Studio's character system into a Minecraft-native rig
workflow.

## Implemented

- Steve Classic rig preset with 4px arms.
- Alex Slim rig preset with 3px arms.
- Generic blocky, armored player, zombie, skeleton, creeper, and enderman rig
  placeholders.
- Bone-level selection from the viewport and outliner.
- Bone rotation editing in the inspector.
- Bone rotation keyframes through `bone.rotation.<boneId>` timeline tracks.
- Rig timeline lane for generated bone clips.
- Pose library with 16 built-in poses.
- Animation presets for idle, walk, run, sword swing, hit reaction,
  turn-around, head look, and jump/land.
- PNG skin import metadata and UV mapping for Minecraft 64x64 and legacy 64x32
  skins.
- Blockbench `.bbmodel` JSON MVP importer and static OBJ preview conversion.
- Attachment points for right hand, left hand, head, and back, with placeholder
  sword/item support.
- IK-ready placeholder architecture.

## Rig Presets

MVP rigs:

- Steve Classic
- Alex Slim

Prepared placeholders:

- Generic blocky character
- Armored player
- Zombie
- Skeleton
- Creeper
- Enderman

All player-compatible rigs expose:

- root
- body
- head
- leftArm
- rightArm
- leftLeg
- rightLeg
- optional cape
- attachment points for hands, head, and back

## Save Format

Phase 5 projects use `schemaVersion: 6`.

Rig data is stored in:

- `scene.characters[].rigPreset`
- `scene.characters[].boneRotations`
- `scene.characters[].skin`
- `scene.characters[].attachments`
- `scene.characters[].boneKeyframes`
- `animation.tracks[]` with `bone.rotation.*` properties
- `rigs.savedPoses`
- `rigs.animationClips`
- `rigs.blockbenchModels`

Older v1-v5 projects migrate to v6 on load.

## Current Limits

- IK solver math is a documented placeholder.
- Mob presets share the core player-like skeleton until dedicated mob geometry
  is implemented.
- Skin model guessing uses filename hints (`alex`, `slim`, `steve`,
  `classic`) and otherwise defaults to Steve.
- Blockbench import creates static preview geometry; automatic rig mapping is
  prepared but not implemented.
