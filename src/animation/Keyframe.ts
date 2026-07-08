import type { Keyframe, Vector3Tuple } from "../project/ProjectFile";

export function createVectorKeyframe(
  frame: number,
  value: Vector3Tuple
): Keyframe<Vector3Tuple> {
  return {
    frame: Math.max(0, Math.round(frame)),
    value: [...value]
  };
}

