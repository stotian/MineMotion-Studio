import type { CharacterEntity, MineMotionProject } from "../project/ProjectFile";
import { getDefaultBoneRotations } from "./RigDefinition";
import { getRigDefinition, normalizeRigPresetId } from "./MinecraftRigPresets";
import { createDefaultCharacterAttachments } from "./RigInstance";
import type { RigProjectData, RigVector3Tuple } from "./RigTypes";
import {
  RIG_CONTRACT_LIMITS,
  sanitizeRigAttachments,
  sanitizeRigPose,
  sanitizeRigVector
} from "./RigContract";

export function sanitizeCharacterRig(character: CharacterEntity): CharacterEntity {
  const rigPreset = normalizeRigPresetId(character.rigPreset);
  const definition = getRigDefinition(rigPreset);
  const defaults = getDefaultBoneRotations(definition);
  const boneRotations: Record<string, RigVector3Tuple> = { ...defaults };

  for (const [boneId, rotation] of Object.entries(character.boneRotations ?? {}).slice(0, RIG_CONTRACT_LIMITS.bones)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(boneId)) continue;
    boneRotations[boneId] = sanitizeRigVector(rotation, defaults[boneId]);
  }

  return {
    ...character,
    rigPreset,
    modelType: character.modelType ?? definition.modelType,
    selectedBoneId:
      character.selectedBoneId && definition.bones.some((bone) => bone.id === character.selectedBoneId)
        ? character.selectedBoneId
        : "body",
    boneRotations,
    skin: character.skin ?? null,
    attachments: sanitizeRigAttachments(
      character.attachments,
      definition,
      createDefaultCharacterAttachments()
    ),
    boneKeyframes: character.boneKeyframes ?? []
  };
}

export function sanitizeRigProjectData(
  rigs: Partial<RigProjectData> | undefined
): RigProjectData {
  return {
    savedPoses: Array.isArray(rigs?.savedPoses)
      ? rigs.savedPoses
          .slice(0, RIG_CONTRACT_LIMITS.poses)
          .map((pose, index) => sanitizeRigPose(pose, index))
          .filter((pose): pose is NonNullable<typeof pose> => pose !== null)
      : [],
    animationClips: Array.isArray(rigs?.animationClips) ? rigs.animationClips : [],
    blockbenchModels: Array.isArray(rigs?.blockbenchModels)
      ? rigs.blockbenchModels
      : []
  };
}

export function getRigTimelineItems(project: MineMotionProject) {
  return project.animation.tracks
    .filter((track) => track.property.startsWith("bone.rotation."))
    .map((track) => {
      const boneId = track.property.replace("bone.rotation.", "");
      const first = track.keyframes[0]?.frame ?? 0;
      const last = track.keyframes.at(-1)?.frame ?? first;
      const character = project.scene.characters.find((item) => item.id === track.targetId);
      return {
        id: `rig_${track.id}`,
        type: "rig" as const,
        label: `${character?.name ?? "Rig"}:${boneId}`,
        targetId: track.targetId,
        boneId,
        startFrame: first,
        durationFrames: Math.max(1, last - first)
      };
    });
}
