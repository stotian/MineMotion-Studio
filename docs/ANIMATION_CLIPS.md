# Animation Clips And NLA

Animation clips package selected keyframes into reusable, target-relative data.

## Save A Clip

1. Select keys in the Dopesheet.
2. Click **Save Clip**.
3. Name the clip.
4. The clip appears in the **Animation Clips** selector.

Clip keyframes are normalized so the first selected frame becomes frame zero.
The clip records its compatible target category: character, camera, or object.

## Apply A Clip

Select a compatible target, choose a clip, move the playhead, and click
**Apply Clip**. MineMotion creates or updates matching property tracks starting
at the playhead.

## Animation Layers

Choose a compatible layer and click **Add To NLA** to create a non-destructive
clip instance. MineMotion evaluates the existing global tracks first and then
the ordered NLA layers:

1. Base Animation
2. Upper Body
3. Head Look
4. Hand Adjustment
5. Additive Motion
6. VFX Synchronization

Override layers have fixed bone scopes. Additive Motion applies the change from
the source clip's first sample, rather than replacing the current pose. Layer
and clip-instance weights multiply.

NLA instances store:

- source clip and target
- start and duration
- time scale
- weight
- mute state

Double-click a block to toggle its instance mute state. The layer controls edit
the layer mute and weight. A VFX Synchronization layer can reference existing
effects, but it does not copy or replace their timeline timing or parameters.

## Serialization

Clips, animation-layer NLA tracks, markers, keyframe IDs, and interpolation
modes are included in schema v10 project and `.minemotion` package data.
Legacy NLA tracks without layer metadata load as Base Animation.
