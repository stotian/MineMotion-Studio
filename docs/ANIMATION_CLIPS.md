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

## NLA Skeleton

Click **Add To NLA** to create a non-destructive clip instance. NLA instances
store:

- source clip and target
- start and duration
- time scale
- weight
- mute state

Double-click an NLA block to toggle mute. Phase 6 stores and edits the stack;
full weighted NLA evaluation/blending is intentionally deferred.

## Serialization

Clips, NLA tracks, markers, keyframe IDs, and interpolation modes are included
in schema v9 project and `.minemotion` package data.
