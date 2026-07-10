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
  return {
    ...character,
    boneRotations: mergeBoneRotations(character.boneRotations, pose.boneRotations)
  };
}

export function resetRigPose(character: CharacterEntity): CharacterEntity {
  const definition = getRigDefinition(character.rigPreset);
  return {
    ...character,
    boneRotations: getDefaultBoneRotations(definition)
  };
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

  return {
    ...character,
    boneRotations: mirrored
  };
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
