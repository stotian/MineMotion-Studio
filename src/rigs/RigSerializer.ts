import type { CharacterEntity, MineMotionProject } from "../project/ProjectFile";
import { getDefaultBoneRotations } from "./RigDefinition";
import { getRigDefinition, normalizeRigPresetId } from "./MinecraftRigPresets";
import { createDefaultCharacterAttachments } from "./RigInstance";
import type { CharacterCustomGeometry, RigProjectData, RigVector3Tuple } from "./RigTypes";
import {
  RIG_CONTRACT_LIMITS,
  sanitizeRigAttachments,
  sanitizeRigPose,
  sanitizeRigVector
} from "./RigContract";
import { sanitizeBlockbenchModelAssets } from "./blockbench/BlockbenchAssetContract";
import { sanitizeCharacterExpression } from "./expressions/ExpressionOverlay";

export function sanitizeCharacterRig(character: CharacterEntity): CharacterEntity {
  const {
    expression: _expression,
    customGeometry: _customGeometry,
    ...baseCharacter
  } = character;
  const rigPreset = normalizeRigPresetId(character.rigPreset);
  const definition = getRigDefinition(rigPreset);
  const defaults = getDefaultBoneRotations(definition);
  const boneRotations: Record<string, RigVector3Tuple> = { ...defaults };

  for (const [boneId, rotation] of Object.entries(character.boneRotations ?? {}).slice(0, RIG_CONTRACT_LIMITS.bones)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(boneId)) continue;
    boneRotations[boneId] = sanitizeRigVector(rotation, defaults[boneId]);
  }

  const expression = sanitizeCharacterExpression(character.expression);
  const customGeometry = sanitizeCustomGeometry(
    character.customGeometry,
    new Set(definition.bones.map((bone) => bone.id))
  );
  return {
    ...baseCharacter,
    rigPreset,
    modelType: character.modelType ?? definition.modelType,
    selectedBoneId:
      character.selectedBoneId && definition.bones.some((bone) => bone.id === character.selectedBoneId)
        ? character.selectedBoneId
        : "body",
    boneRotations,
    skin: character.skin ?? null,
    ...(expression ? { expression } : {}),
    attachments: sanitizeRigAttachments(
      character.attachments,
      definition,
      createDefaultCharacterAttachments()
    ),
    boneKeyframes: character.boneKeyframes ?? [],
    ...(customGeometry ? { customGeometry } : {})
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
    blockbenchModels: sanitizeBlockbenchModelAssets(rigs?.blockbenchModels)
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

function sanitizeCustomGeometry(
  value: CharacterCustomGeometry | undefined,
  validBones: Set<string>
): CharacterCustomGeometry | undefined {
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.cubes)) return undefined;
  const cubes = value.cubes.slice(0, 4096).flatMap((cube, index) => {
    if (!cube || typeof cube !== "object" || !validBones.has(cube.boneId)) return [];
    const size = sanitizeRigVector(cube.size, [1, 1, 1]).map((entry) => Math.max(0.01, Math.min(256, Math.abs(entry)))) as RigVector3Tuple;
    return [{
      id: typeof cube.id === "string" && cube.id ? cube.id.slice(0, 128) : `rigged_cube_${index}`,
      name: typeof cube.name === "string" && cube.name.trim() ? cube.name.trim().slice(0, 120) : `Rigged cube ${index + 1}`,
      boneId: cube.boneId,
      position: sanitizeRigVector(cube.position, [0, 0, 0]),
      size,
      color: typeof cube.color === "string" && /^#[0-9a-fA-F]{6}$/.test(cube.color) ? cube.color : "#8f8f8f",
      materialName: typeof cube.materialName === "string" ? cube.materialName.trim().slice(0, 120) || "voxel" : "voxel",
      visible: cube.visible !== false
    }];
  });
  return {
    schemaVersion: 1,
    sourceModelId: typeof value.sourceModelId === "string" ? value.sourceModelId.slice(0, 128) : null,
    hideDefaultGeometry: value.hideDefaultGeometry !== false,
    cubes
  };
}
