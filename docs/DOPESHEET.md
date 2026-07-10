# Dopesheet

Select **Dopesheet** in the animation editor.

## Track Hierarchy

Tracks are grouped by scene target, then by property. Transform and
`bone.rotation.*` tracks share the same model, so camera, object, and character
keys use the same commands.

## Selection

- Click a key to select it.
- Ctrl-click toggles a key.
- Shift-click selects an inclusive range on the anchored track.
- Clicking a key also moves the playhead to its frame.

## Editing

- Drag a selected key horizontally to move the full selection.
- Use `-Nf` or `+Nf` for exact nudges.
- Copy and paste preserve timing relative to the first copied key.
- Duplicate offsets by the current snap interval.
- Delete removes selected keys and empty tracks.
- `0.5x` and `2x` scale selected timing around the current playhead.
- Snap constrains moved keys to the configured frame interval.

All commands are immutable and pass through the normal MineMotion history
checkpoint path.
