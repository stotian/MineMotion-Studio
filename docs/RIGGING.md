# Rigging

MineMotion Studio's Phase 5 rigging system is Minecraft-first. It focuses on
blocky bones, readable poses, and direct timeline keyframes.

## Selecting Bones

Bones can be selected from:

- the viewport, by clicking a body part
- the outliner, under each character

The selected bone appears in the inspector with editable rotation values.

## Bone Keyframes

When a bone is selected, **Add Keyframe** records a bone rotation keyframe
instead of a transform keyframe.

Animation tracks use properties like:

```text
bone.rotation.head
bone.rotation.rightArm
bone.rotation.leftLeg
```

The animator samples those tracks during playback and applies the values back
to `character.boneRotations`.

## Pose Tools

Available actions:

- Apply Pose
- Save Current Pose
- Mirror Pose
- Reset Pose
- Add Bone Keyframe

Mirroring swaps paired limbs and flips Y/Z rotation signs.

## Attachments

Prepared attachment points:

- rightHand
- leftHand
- head
- back

The renderer supports placeholder sword and item cube attachments. OBJ
attachment assignment is prepared in the data model and should be wired in a
future pass.

## IK

The `src/rigs/IK` folder owns the pure analytic two-bone solver, bounded
Steve/Alex hand/foot session controls, deterministic live preview, and atomic
bake-to-keyframes through global `bone.rotation.*` tracks.

Left and right foot controls can also bake an inclusive planted range. The
runtime samples embedded imported chunks or the active terrain preset, fixes
one ground-aligned world anchor, converts it back to leg-local IK space for each
sampled frame, and writes the complete range through one history operation.
Missing ground, invalid transforms, and unreachable frames fail without partial
keys. Foot-lock settings are session tools and add no serialized authority.
