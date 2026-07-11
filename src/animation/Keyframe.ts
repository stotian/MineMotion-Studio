import type { Keyframe, Vector3Tuple } from "../project/ProjectFile";
import { createId } from "../core/ids/Id";

export function createVectorKeyframe(
  frame: number,
  value: Vector3Tuple
): Keyframe<Vector3Tuple> {
  return {
    id: createKeyframeId(frame),
    frame: Math.max(0, Math.round(frame)),
    value: [...value],
    interpolation: "linear"
  };
}

export function createKeyframeId(frame: number): string {
  return createId(`key_${Math.max(0, Math.round(frame)).toString(36)}`);
}
