# Phase 19.5 - Look-at Constraints

## Pure solve checkpoint

The first Phase 19.5 checkpoint defines one renderer-neutral look-at solve
contract for head bones, production cameras, and scene objects.

- Source, target, current rotation, up direction, limits, influence, and Euler
  order are explicit bounded inputs.
- Local `-Z` is the single forward-axis convention.
- `XYZ` matches scene object and rig rendering; `YXZ` matches the production
  camera controller.
- A world-up basis produces a zero-roll target when possible. Vertical targets
  use a deterministic fallback.
- Influence uses shortest-path quaternion interpolation before component limits.
- The result reports ideal/final rotations, requested/evaluated directions,
  clamping, reach state, and stable warnings.
- Plain-data/accessor and non-finite hostile inputs fail without side effects.

This checkpoint adds no serialized constraint state, UI, or tracks. The next
step is to map head parent space plus camera/object world space, then preview and
bake through existing `bone.rotation.head` or `transform.rotation` tracks.
