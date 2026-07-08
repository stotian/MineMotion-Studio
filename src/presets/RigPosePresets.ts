import type { CharacterEntity, Vector3Tuple } from "../project/ProjectFile";

export interface RigPosePreset {
  id: string;
  name: string;
  description: string;
  boneRotations: Record<string, Vector3Tuple>;
}

export const RIG_POSE_PRESETS: RigPosePreset[] = [
  {
    id: "idle",
    name: "Idle",
    description: "Neutral standing pose.",
    boneRotations: {
      root: [0, 0, 0],
      body: [0, 0, 0],
      head: [0, 0, 0],
      leftArm: [0, 0, -8],
      rightArm: [0, 0, 8],
      leftLeg: [0, 0, 0],
      rightLeg: [0, 0, 0]
    }
  },
  {
    id: "walk-a",
    name: "Walk frame A",
    description: "First half of a simple walk cycle.",
    boneRotations: {
      leftArm: [24, 0, -8],
      rightArm: [-24, 0, 8],
      leftLeg: [-22, 0, 0],
      rightLeg: [22, 0, 0]
    }
  },
  {
    id: "walk-b",
    name: "Walk frame B",
    description: "Second half of a simple walk cycle.",
    boneRotations: {
      leftArm: [-24, 0, -8],
      rightArm: [24, 0, 8],
      leftLeg: [22, 0, 0],
      rightLeg: [-22, 0, 0]
    }
  },
  {
    id: "look-left",
    name: "Looking left",
    description: "Head turned left.",
    boneRotations: {
      head: [0, 35, 0]
    }
  },
  {
    id: "look-right",
    name: "Looking right",
    description: "Head turned right.",
    boneRotations: {
      head: [0, -35, 0]
    }
  },
  {
    id: "arms-crossed-placeholder",
    name: "Arms crossed",
    description: "Readable placeholder for a crossed-arms pose.",
    boneRotations: {
      leftArm: [0, 0, -58],
      rightArm: [0, 0, 58]
    }
  },
  {
    id: "pointing-placeholder",
    name: "Pointing",
    description: "One arm extended forward.",
    boneRotations: {
      rightArm: [-82, 0, 12],
      leftArm: [8, 0, -8],
      head: [-8, -15, 0]
    }
  }
];

export function applyRigPosePreset(
  character: CharacterEntity,
  preset: RigPosePreset
): CharacterEntity {
  return {
    ...character,
    boneRotations: {
      ...character.boneRotations,
      ...preset.boneRotations
    }
  };
}

