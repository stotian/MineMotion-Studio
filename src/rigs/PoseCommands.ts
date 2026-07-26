import type { CharacterEntity, MineMotionProject } from "../project/ProjectFile";
import { cloneRotation } from "./BoneTransform";
import { createRigInstance, mirrorCurrentPose, resetRigPose } from "./RigInstance";
import { getRigDefinition } from "./MinecraftRigPresets";
import type { RigPresetId, RigVector3Tuple } from "./RigTypes";

export const RIG_POSE_CLIPBOARD_VERSION = 1 as const;

export interface RigPoseClipboard {
  version: typeof RIG_POSE_CLIPBOARD_VERSION;
  sourceRigId: RigPresetId;
  boneRotations: Record<string, RigVector3Tuple>;
}

export interface PoseCommandResult {
  project: MineMotionProject;
  changed: boolean;
  error: string | null;
}

export function copyCharacterPose(
  character: CharacterEntity
): RigPoseClipboard {
  const definition = getRigDefinition(character.rigPreset);
  const instance = createRigInstance(character);
  return {
    version: RIG_POSE_CLIPBOARD_VERSION,
    sourceRigId: definition.id,
    boneRotations: Object.fromEntries(
      definition.bones.map((bone) => [
        bone.id,
        cloneRotation(instance.boneRotations[bone.id])
      ])
    )
  };
}

export function pasteProjectCharacterPose(
  project: MineMotionProject,
  characterId: string,
  clipboard: RigPoseClipboard | null,
  influence = 1
): PoseCommandResult {
  if (!clipboard ||
    clipboard.version !== RIG_POSE_CLIPBOARD_VERSION ||
    !clipboard.boneRotations ||
    typeof clipboard.boneRotations !== "object") {
    return commandFailure(project, "POSE_CLIPBOARD_EMPTY");
  }
  if (!Number.isFinite(influence)) {
    return commandFailure(project, "POSE_BLEND_INFLUENCE_INVALID");
  }
  const amount = Math.min(1, Math.max(0, influence));
  if (amount === 0) {
    return commandFailure(project, "POSE_BLEND_UNCHANGED");
  }
  return updateProjectCharacterPose(project, characterId, (character) =>
    blendCharacterPose(character, clipboard, amount)
  );
}

export function mirrorProjectCharacterPose(
  project: MineMotionProject,
  characterId: string
): PoseCommandResult {
  return updateProjectCharacterPose(project, characterId, mirrorCurrentPose);
}

export function resetProjectCharacterPose(
  project: MineMotionProject,
  characterId: string
): PoseCommandResult {
  return updateProjectCharacterPose(project, characterId, resetRigPose);
}

function blendCharacterPose(
  character: CharacterEntity,
  clipboard: RigPoseClipboard,
  influence: number
): CharacterEntity {
  const definition = getRigDefinition(character.rigPreset);
  const current = createRigInstance(character).boneRotations;
  const rotations = { ...character.boneRotations };
  let changed = false;
  let compatible = false;

  for (const bone of definition.bones) {
    const source = clipboard.boneRotations[bone.id];
    if (!isFiniteRotation(source)) continue;
    compatible = true;
    const previous = current[bone.id] ?? [0, 0, 0];
    const value: RigVector3Tuple = [
      normalizeZero(previous[0] + (source[0] - previous[0]) * influence),
      normalizeZero(previous[1] + (source[1] - previous[1]) * influence),
      normalizeZero(previous[2] + (source[2] - previous[2]) * influence)
    ];
    rotations[bone.id] = value;
    if (!rotationsEqual(previous, value)) changed = true;
  }

  return compatible && changed
    ? { ...character, boneRotations: rotations }
    : character;
}

function updateProjectCharacterPose(
  project: MineMotionProject,
  characterId: string,
  transform: (character: CharacterEntity) => CharacterEntity
): PoseCommandResult {
  const character = project.scene.characters.find(
    (candidate) => candidate.id === characterId
  );
  if (!character) return commandFailure(project, "POSE_CHARACTER_MISSING");
  if (character.locked) return commandFailure(project, "POSE_CHARACTER_LOCKED");
  const transformed = transform(character);
  if (transformed === character) {
    return commandFailure(project, "POSE_UNCHANGED");
  }
  return {
    project: {
      ...project,
      scene: {
        ...project.scene,
        characters: project.scene.characters.map((candidate) =>
          candidate.id === characterId ? transformed : candidate
        )
      }
    },
    changed: true,
    error: null
  };
}

function isFiniteRotation(value: unknown): value is RigVector3Tuple {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) =>
      typeof component === "number" && Number.isFinite(component)
    );
}

function rotationsEqual(
  left: RigVector3Tuple,
  right: RigVector3Tuple
): boolean {
  return left[0] === right[0] &&
    left[1] === right[1] &&
    left[2] === right[2];
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function commandFailure(
  project: MineMotionProject,
  error: string
): PoseCommandResult {
  return { project, changed: false, error };
}
