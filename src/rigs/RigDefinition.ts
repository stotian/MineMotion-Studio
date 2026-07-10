import type { RigBone } from "./Bone";
import type { CharacterAttachmentPointId, RigPresetId, RigVector3Tuple } from "./RigTypes";

export interface RigAttachmentPoint {
  id: CharacterAttachmentPointId;
  label: string;
  boneId: string;
  offset: RigVector3Tuple;
  rotation: RigVector3Tuple;
}

export interface RigDefinition {
  id: RigPresetId;
  name: string;
  description: string;
  modelType: "steve" | "alex" | "mob" | "generic";
  armWidthPixels: 3 | 4;
  bones: RigBone[];
  attachmentPoints: RigAttachmentPoint[];
  tags: string[];
  status: "mvp" | "placeholder";
}

export function getDefaultBoneRotations(
  definition: RigDefinition
): Record<string, RigVector3Tuple> {
  const rotations: Record<string, RigVector3Tuple> = {};
  for (const bone of definition.bones) {
    rotations[bone.id] = [0, 0, 0];
  }
  rotations.leftArm = [0, 0, -8];
  rotations.rightArm = [0, 0, 8];
  return rotations;
}
