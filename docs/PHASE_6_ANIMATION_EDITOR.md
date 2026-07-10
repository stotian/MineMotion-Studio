# Phase 6: Professional Animation Editor

Phase 6 upgrades the original frame scrubber into a project-backed animation
workspace with Timeline, Dopesheet, Graph, and NLA views.

## Delivered

- Hierarchical target/property tracks.
- Stable keyframe IDs and per-key interpolation metadata.
- Multi-selection, range selection, move, drag, copy, paste, delete, duplicate,
  frame snapping, and timing scale commands.
- Constant, linear, ease-in, ease-out, ease-in-out, and Bezier-placeholder
  interpolation.
- Named, colored timeline markers with playhead jumps.
- Reusable animation clips generated from selected keyframes.
- Clip application to another selected target.
- NLA-style clip-instance lanes with timing, weight, speed, and mute data.
- Previous/next keyframe and start/end playback navigation.
- Schema v8 migration for markers, clips, NLA data, key IDs, and interpolation.

## Architecture

```text
MineMotionProject.animation
  |-- tracks + keyframes
  |-- markers
  |-- reusable clips
  `-- NLA tracks
          |
          v
Pure editor commands -----> immutable TimelineData update -----> history stack
          |
          +-> Timeline view
          +-> Dopesheet
          +-> Graph Editor
          `-> NLA view
```

The project remains the only persisted animation source. `AnimationEditorState`
stores transient view, selection, clipboard, and snap preferences locally in
the timeline panel.

## Failure Handling

- Commands ignore missing keyframe references instead of corrupting tracks.
- Frame edits clamp at zero and the project duration where applicable.
- Empty selections produce no clip and no destructive change.
- Invalid marker, clip, and NLA payloads are sanitized during migration.
- Bezier uses a documented smoothstep placeholder; editable handles are not
  claimed.

## Architecture Decision Record

Title: Keep animation editing project-backed

Status: Accepted

Context: A separate editor store would duplicate keyframe data and could drift
from project save/load, playback, rig presets, and export.

Decision: Persist tracks, markers, reusable clips, and NLA instances in the
project. Keep only selection, clipboard, view mode, and snap controls transient.

Consequences: Undo/save/export all observe the same data. The React views stay
thin, while future NLA evaluation can extend the existing project model without
replacing the editor.
