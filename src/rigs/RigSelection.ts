const BONE_SELECTION_SEPARATOR = "::bone::";

export interface RigBoneSelection {
  characterId: string;
  boneId: string;
}

export function makeBoneObjectId(characterId: string, boneId: string): string {
  return `${characterId}${BONE_SELECTION_SEPARATOR}${boneId}`;
}

export function parseRigBoneSelection(objectId: string | null): RigBoneSelection | null {
  if (!objectId || !objectId.includes(BONE_SELECTION_SEPARATOR)) {
    return null;
  }
  const [characterId, boneId] = objectId.split(BONE_SELECTION_SEPARATOR);
  if (!characterId || !boneId) {
    return null;
  }
  return { characterId, boneId };
}

export function getSelectedCharacterId(objectId: string | null): string | null {
  return parseRigBoneSelection(objectId)?.characterId ?? objectId;
}

export function getSelectedBoneId(objectId: string | null): string | null {
  return parseRigBoneSelection(objectId)?.boneId ?? null;
}
