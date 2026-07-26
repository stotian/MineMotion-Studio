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

## Look-at Constraints

Rig Studio provides session-only look-at controls for a selected character head,
production camera, or imported object. A control can target another animated
scene entity or an explicit world position, set influence, and bound maximum
Euler angles.

The pure solver uses local `-Z`, renderer-matched `XYZ` for heads/objects, and
the production camera's `YXZ` order. Head targets are converted through the
character transform and root/body hierarchy into head-parent space. Live
preview derives a temporary project; bake samples the selected target at the
current frame and writes exactly one existing `bone.rotation.head` or
`transform.rotation` track through one history operation.

Constraint controls are never serialized. Eye direction currently follows the
head; a separate expression overlay remains an explicit placeholder.

## Motion Paths

Rig Studio can derive and show a selected character root, left/right hand
attachment, or production-camera path over an inclusive timeline range. The
panel reports frame/second duration, traveled distance, sample count, and exact
relevant key count.

Paths sample authoritative global tracks followed by existing NLA animation
layers with the production interpolation curves. NLA-local keys are remapped
through clip start and time scale. The viewport renders a colored polyline plus
white keyframe points; both are owned and disposed by the normal scene root.
Path controls and geometry are session-only and are hidden from render preview
and export.

Direct path editing remains optional and is deferred until it can delegate to
the existing keyframe commands without creating another animation authority.

## Animation Layers

The timeline's existing NLA collection owns Base Animation, Upper Body, Head
Look, Hand Adjustment, Additive Motion, and VFX Synchronization layers. Global
tracks are sampled first; the six fixed kinds then blend in order using bounded
layer and clip-instance weights. Each override layer has a fixed rig scope and
Additive Motion uses the clip's first sample as its reference.

Layer controls are localized and commit through existing project history.
VFX Synchronization contains effect IDs only; the effects collection remains
the single timing and parameter authority.

## Procedural Animation

Rig Studio can generate bounded idle-breathing, walk, run, crouch-walk, jump,
landing, recoil, hit-reaction, sword-swing, and turn animation with duration,
intensity, applicable cycle, and direction controls. Locomotion profiles drive
opposing limbs plus body/head posture and close exactly; action profiles expose
authored anticipation, impact, and recovery beats.

Settings are session-only. The result is both a reusable deterministic clip and
ordinary global bone keys at the playhead, so it remains editable with the
existing timeline, Dopesheet, and Graph tools. Repeating identical generation
replaces equal-frame keys and one generation creates one history operation.
All kinds survive current project/package/autosave and schema 9 paths.
