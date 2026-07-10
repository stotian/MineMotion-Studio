import type { RigPose, RigVector3Tuple } from "./RigTypes";

export function sanitizePose(pose: Partial<RigPose>): RigPose {
  return {
    id: pose.id || `pose_${Date.now().toString(36)}`,
    name: pose.name || "Untitled Pose",
    description: pose.description || "Custom pose.",
    boneRotations: sanitizeBoneRotations(pose.boneRotations)
  };
}

export function sanitizeBoneRotations(
  rotations: RigPose["boneRotations"] | undefined
): Record<string, RigVector3Tuple> {
  const next: Record<string, RigVector3Tuple> = {};
  for (const [boneId, rotation] of Object.entries(rotations ?? {})) {
    next[boneId] = [
      Number(rotation?.[0] ?? 0),
      Number(rotation?.[1] ?? 0),
      Number(rotation?.[2] ?? 0)
    ];
  }
  return next;
}
