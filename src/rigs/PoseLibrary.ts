import type { CharacterEntity } from "../project/ProjectFile";
import { applyRigPose } from "./RigInstance";
import type { RigPose } from "./RigTypes";

export const BUILTIN_RIG_POSES: RigPose[] = [
  pose("idle", "Idle", "Neutral readable stance.", {
    root: [0, 0, 0],
    body: [0, 0, 0],
    head: [0, 0, 0],
    leftArm: [0, 0, -8],
    rightArm: [0, 0, 8],
    leftLeg: [0, 0, 0],
    rightLeg: [0, 0, 0]
  }),
  pose("walk-a", "Walk A", "First half of a walk cycle.", {
    leftArm: [28, 0, -8],
    rightArm: [-28, 0, 8],
    leftLeg: [-28, 0, 0],
    rightLeg: [28, 0, 0],
    body: [2, 0, 0]
  }),
  pose("walk-b", "Walk B", "Second half of a walk cycle.", {
    leftArm: [-28, 0, -8],
    rightArm: [28, 0, 8],
    leftLeg: [28, 0, 0],
    rightLeg: [-28, 0, 0],
    body: [-2, 0, 0]
  }),
  pose("run-a", "Run A", "Large stride run pose.", {
    leftArm: [48, 0, -10],
    rightArm: [-48, 0, 10],
    leftLeg: [-42, 0, 0],
    rightLeg: [42, 0, 0],
    body: [8, 0, 0],
    head: [-5, 0, 0]
  }),
  pose("run-b", "Run B", "Opposite large stride run pose.", {
    leftArm: [-48, 0, -10],
    rightArm: [48, 0, 10],
    leftLeg: [42, 0, 0],
    rightLeg: [-42, 0, 0],
    body: [8, 0, 0],
    head: [-5, 0, 0]
  }),
  pose("jump", "Jump", "Takeoff pose.", {
    body: [-8, 0, 0],
    head: [-8, 0, 0],
    leftArm: [-44, 0, -16],
    rightArm: [-44, 0, 16],
    leftLeg: [24, 0, -4],
    rightLeg: [16, 0, 4]
  }),
  pose("land", "Land", "Landing crouch pose.", {
    body: [12, 0, 0],
    head: [8, 0, 0],
    leftArm: [18, 0, -18],
    rightArm: [18, 0, 18],
    leftLeg: [-28, 0, -6],
    rightLeg: [-28, 0, 6]
  }),
  pose("attack-windup", "Attack Windup", "Weapon swing preparation.", {
    body: [0, -18, 0],
    head: [-6, -16, 0],
    rightArm: [-94, 12, 24],
    leftArm: [20, 0, -12]
  }),
  pose("attack-swing", "Attack Swing", "Follow-through weapon swing.", {
    body: [0, 22, 0],
    head: [-8, 18, 0],
    rightArm: [-36, -18, -46],
    leftArm: [34, 0, -20]
  }),
  pose("block-defend", "Block/Defend", "Guard pose for shield or block.", {
    body: [0, 8, 0],
    head: [0, 8, 0],
    leftArm: [-64, 0, -42],
    rightArm: [-22, 0, 18]
  }),
  pose("look-left", "Look Left", "Head turned left.", {
    head: [0, 35, 0]
  }),
  pose("look-right", "Look Right", "Head turned right.", {
    head: [0, -35, 0]
  }),
  pose("sitting", "Sitting", "Seated Minecraft pose.", {
    body: [0, 0, 0],
    leftArm: [8, 0, -8],
    rightArm: [8, 0, 8],
    leftLeg: [-82, 0, -4],
    rightLeg: [-82, 0, 4]
  }),
  pose("crouch", "Crouch", "Low cautious pose.", {
    body: [14, 0, 0],
    head: [10, 0, 0],
    leftArm: [18, 0, -10],
    rightArm: [18, 0, 10],
    leftLeg: [-18, 0, 0],
    rightLeg: [-18, 0, 0]
  }),
  pose("fear-back-away", "Fear/Back Away", "Recoiling pose.", {
    body: [-12, 0, 0],
    head: [-18, 0, 0],
    leftArm: [-72, 0, -34],
    rightArm: [-72, 0, 34],
    leftLeg: [18, 0, -5],
    rightLeg: [-12, 0, 5]
  }),
  pose("hero-pose", "Hero Pose", "Camera-ready confident stance.", {
    body: [-4, 0, 0],
    head: [-6, -18, 0],
    leftArm: [12, 0, -28],
    rightArm: [0, 0, 36],
    leftLeg: [4, 0, -8],
    rightLeg: [-4, 0, 8]
  })
];

export function applyPoseToCharacter(
  character: CharacterEntity,
  poseId: string
): CharacterEntity {
  const poseDefinition = BUILTIN_RIG_POSES.find((candidate) => candidate.id === poseId);
  return poseDefinition ? applyRigPose(character, poseDefinition) : character;
}

function pose(
  id: string,
  name: string,
  description: string,
  boneRotations: RigPose["boneRotations"]
): RigPose {
  return { id, name, description, boneRotations };
}
