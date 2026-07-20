# Two-bone IK contract

Chains describe root/end bones and exactly two ordered positive-length joints.
Targets and poles are structured bounded data; the solver is pure and never
mutates a project or timeline.

The solver operates in the controlled upper bone's parent-local coordinate
space. Minecraft player limbs use local `-Y` as their neutral forward axis.
Returned rotations are local XYZ Euler angles in degrees, matching the
`THREE.Euler(..., "XYZ")` path used by the renderer. Parent and child rotations
compose as `upperWorld * lowerLocal`.

Influence is applied with shortest-path quaternion slerp from identity to the
analytic rotation. Component limits are then applied to the project's local XYZ
degree representation. `idealJointPosition` and `idealEndPosition` describe the
analytic solution before influence and limits; `evaluatedJointPosition` and
`evaluatedEndPosition` are reconstructed from the returned rotations and are
the authoritative preview positions. The older `jointPosition` and
`endPosition` aliases retain their Phase 19.2 ideal-position meaning.

Left and right player limbs share the same local forward axis. Their bend side
comes only from the explicit local pole vector, so mirrored controls remain
deterministic instead of relying on a renderer-specific sign convention.
