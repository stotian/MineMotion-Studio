import type { CharacterEntity } from "../project/ProjectFile";
import { getDefaultBoneRotations } from "./RigDefinition";
import { getRigDefinition } from "./MinecraftRigPresets";
import { cloneRotation, mergeBoneRotations, mirrorRotation } from "./BoneTransform";
import type { CharacterAttachment, RigPose, RigVector3Tuple } from "./RigTypes";

export interface RigInstance {
  characterId: string;
  definitionId: string;
  boneRotations: Record<string, RigVector3Tuple>;
}

export function createRigInstance(character: CharacterEntity): RigInstance {
  const definition = getRigDefinition(character.rigPreset);
  return {
    characterId: character.id,
    definitionId: definition.id,
    boneRotations: mergeBoneRotations(
      getDefaultBoneRotations(definition),
      character.boneRotations
    )
  };
}

export function createDefaultCharacterAttachments(): CharacterAttachment[] {
  return [
    {
      id: "attachment_right_hand_sword",
      name: "Sword Placeholder",
      pointId: "rightHand",
      kind: "placeholder_sword",
      visible: false
    },
    {
      id: "attachment_left_hand_item",
      name: "Item Cube Placeholder",
      pointId: "leftHand",
      kind: "placeholder_item_cube",
      visible: false
    }
  ];
}

export function updateBoneRotation(
  character: CharacterEntity,
  boneId: string,
  rotation: RigVector3Tuple
): CharacterEntity {
  return {
    ...character,
    selectedBoneId: boneId,
    boneRotations: {
      ...character.boneRotations,
      [boneId]: cloneRotation(rotation)
    }
  };
}

export function applyRigPose(character: CharacterEntity, pose: RigPose): CharacterEntity {
  return updateCharacterRotations(
    character,
    mergeBoneRotations(character.boneRotations, pose.boneRotations)
  );
}

export function resetRigPose(character: CharacterEntity): CharacterEntity {
  const definition = getRigDefinition(character.rigPreset);
  return updateCharacterRotations(
    character,
    getDefaultBoneRotations(definition)
  );
}

export function mirrorCurrentPose(character: CharacterEntity): CharacterEntity {
  const definition = getRigDefinition(character.rigPreset);
  const mirrored: Record<string, RigVector3Tuple> = {
    ...character.boneRotations
  };

  for (const bone of definition.bones) {
    if (!bone.mirrorOf || bone.id > bone.mirrorOf) continue;
    const left = character.boneRotations[bone.id] ?? [0, 0, 0];
    const right = character.boneRotations[bone.mirrorOf] ?? [0, 0, 0];
    mirrored[bone.id] = mirrorRotation(right);
    mirrored[bone.mirrorOf] = mirrorRotation(left);
  }

  return updateCharacterRotations(character, mirrored);
}

export function savePoseFromCharacter(character: CharacterEntity, name: string): RigPose {
  return {
    id: `pose_${Date.now().toString(36)}`,
    name,
    description: `Saved pose from ${character.name}.`,
    boneRotations: Object.fromEntries(
      Object.entries(character.boneRotations).map(([boneId, rotation]) => [
        boneId,
        cloneRotation(rotation as RigVector3Tuple)
      ])
    )
  };
}

function updateCharacterRotations(
  character: CharacterEntity,
  boneRotations: Record<string, RigVector3Tuple>
): CharacterEntity {
  const currentIds = Object.keys(character.boneRotations);
  const nextIds = Object.keys(boneRotations);
  const unchanged = currentIds.length === nextIds.length &&
    nextIds.every((boneId) => {
      const current = character.boneRotations[boneId];
      const next = boneRotations[boneId];
      return current !== undefined &&
        current[0] === next[0] &&
        current[1] === next[1] &&
        current[2] === next[2];
    });
  return unchanged
    ? character
    : { ...character, boneRotations };
}
