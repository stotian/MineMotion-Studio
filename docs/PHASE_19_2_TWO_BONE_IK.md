# Phase 19.2 - Deterministic Two-Bone IK

The previous `solveTwoBoneIK` placeholder is now a pure analytic solver for any
two-joint arm or leg chain. Inputs are explicit chain lengths/limits, root,
target, pole direction, and influence; no project, renderer, clock, or hidden
state is accessed.

The solver returns finite upper/local-lower XYZ rotations plus analytic joint and
end positions. Reachable targets are exact. Too-far and too-close targets clamp
to maximum/minimum physical reach and emit stable diagnostic strings. Collinear
poles use a deterministic perpendicular axis. Invalid counts, non-positive
lengths, non-finite targets, and root-coincident targets fail explicitly.

Focused tests cover determinism, segment lengths, reachable and both unreachable
cases, malformed/degenerate inputs, pole fallback, influence, component limits,
and Three.js reconstruction of both solved bone directions. Final gate: 91 files
/ 405 tests, typecheck, 1,824-module build, and zero audit vulnerabilities.

Production hand/foot targets, control persistence, and bake-to-keyframes remain
the explicit Phase 19.3 boundary; the solver itself never creates another
animation authority.
