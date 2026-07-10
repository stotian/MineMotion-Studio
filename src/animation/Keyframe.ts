import type { Keyframe, Vector3Tuple } from "../project/ProjectFile";

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
  const random = Math.random().toString(36).slice(2, 8);
  return `key_${Math.max(0, Math.round(frame)).toString(36)}_${random}`;
}
