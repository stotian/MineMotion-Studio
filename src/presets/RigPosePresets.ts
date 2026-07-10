import type { CharacterEntity } from "../project/ProjectFile";
import { applyRigPose } from "../rigs/RigInstance";
import { BUILTIN_RIG_POSES } from "../rigs/PoseLibrary";
import type { RigPose } from "../rigs/RigTypes";

export type RigPosePreset = RigPose;

export const RIG_POSE_PRESETS: RigPosePreset[] = BUILTIN_RIG_POSES;

export function applyRigPosePreset(
  character: CharacterEntity,
  preset: RigPosePreset
): CharacterEntity {
  return applyRigPose(character, preset);
}
