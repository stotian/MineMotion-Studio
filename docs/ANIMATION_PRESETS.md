# Animation Presets

Phase 5 animation presets generate real bone rotation tracks for selected
characters.

## Built-In Clips

- Idle Breathing
- Walk Cycle
- Run Cycle
- Sword Swing Placeholder
- Hit Reaction
- Camera-Ready Turn-Around
- Head Look Around
- Jump/Land

## How Presets Work

Applying a character animation preset creates timeline tracks with properties
such as:

```text
bone.rotation.leftArm
bone.rotation.rightLeg
bone.rotation.head
```

The rig lane displays generated rig clips. The standard transform lane still
handles whole-object position, rotation, and scale.

## Combining Motion

For a walking shot, combine:

- **Walk Cycle** for limbs.
- **Simple Walk Travel** for whole-character movement.
- Camera presets or camera keyframes for framing.

## Limits

- Interpolation uses the existing sampled vector track pipeline.
- There is no dopesheet or graph editor yet.
- Clip reuse compatibility is data-ready but not a full NLA system.
