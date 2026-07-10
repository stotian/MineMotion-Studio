# Graph Editor

Select at least one keyframe, then open **Graph**.

The MVP displays X, Y, and Z values over the full project duration for the
selected key's property. Values are normalized to the visible graph range so
rotation, position, and scale curves remain readable.

## Interpolation

- Constant
- Linear
- Ease In
- Ease Out
- Ease In Out
- Bezier Placeholder

The Bezier option currently evaluates with a smoothstep curve. It is serialized
as `bezier` so future editable handles can be added without changing project
intent. No handle UI is claimed in this phase.

Interpolation is stored on the left key of a segment and is used by viewport
playback through the existing `Animator` sampler.
