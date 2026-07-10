# IK Notes

Phase 5 adds an IK-ready architecture, not a full IK animator.

- Chains describe root/end bones and ordered joints.
- Targets are stored as structured data so hand/foot controls can be added later.
- `TwoBoneIK` currently validates chain shape and returns a safe placeholder
  result. This keeps the public API stable without faking solved rotations.
