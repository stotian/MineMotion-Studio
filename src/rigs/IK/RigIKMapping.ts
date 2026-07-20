import type { CharacterEntity } from "../../project/ProjectFile";
import { getRigDefinition } from "../MinecraftRigPresets";
import { createIKChain, type IKChain } from "./IKChain";
import { createRigIKControl, type MinecraftLimbId, type RigIKControl } from "./IKControl";

interface LimbMapping {
  upperBoneId: string;
  lowerBoneId: string;
  endBoneId: string;
  label: string;
  length: number;
}

const PLAYER_LIMB_MAPPINGS: Readonly<Record<MinecraftLimbId, LimbMapping>> = Object.freeze({
  leftArm: Object.freeze({ upperBoneId: "leftArm", lowerBoneId: "leftForearm", endBoneId: "leftHand", label: "Left Arm", length: 0.6 }),
  rightArm: Object.freeze({ upperBoneId: "rightArm", lowerBoneId: "rightForearm", endBoneId: "rightHand", label: "Right Arm", length: 0.6 }),
  leftLeg: Object.freeze({ upperBoneId: "leftLeg", lowerBoneId: "leftLowerLeg", endBoneId: "leftFoot", label: "Left Leg", length: 0.6 }),
  rightLeg: Object.freeze({ upperBoneId: "rightLeg", lowerBoneId: "rightLowerLeg", endBoneId: "rightFoot", label: "Right Leg", length: 0.6 })
});

export interface RigIKMappingResult {
  ok: boolean;
  chain: IKChain | null;
  error: string | null;
}

export function createRigIKControlsForCharacter(character: CharacterEntity): RigIKControl[] {
  if (!supportsProductionIK(character)) return [];
  return (Object.keys(PLAYER_LIMB_MAPPINGS) as MinecraftLimbId[]).map((limb) => {
    const mapping = PLAYER_LIMB_MAPPINGS[limb];
    return createRigIKControl(limb, mapping.upperBoneId, mapping.lowerBoneId, [0, -mapping.length * 2, 0]);
  });
}

export function resolveRigIKChain(character: CharacterEntity, control: RigIKControl): RigIKMappingResult {
  if (!supportsProductionIK(character)) {
    return failure("IK_RIG_UNSUPPORTED: Production IK currently supports Steve and Alex player rigs.");
  }
  const mapping = PLAYER_LIMB_MAPPINGS[control.limb];
  if (!mapping || control.id !== `ik:${control.limb}` ||
    control.upperBoneId !== mapping.upperBoneId || control.lowerBoneId !== mapping.lowerBoneId) {
    return failure("IK_CONTROL_CHAIN_MISMATCH: Control IDs do not match the canonical limb chain.");
  }
  if (!Object.hasOwn(character.boneRotations, mapping.upperBoneId) ||
    !Object.hasOwn(character.boneRotations, mapping.lowerBoneId)) {
    return failure("IK_CONTROL_BONE_MISSING: The selected character is missing a required limb bone.");
  }
  return {
    ok: true,
    chain: createIKChain(`ik-chain:${control.limb}`, mapping.label, mapping.upperBoneId, mapping.endBoneId, [
      { boneId: mapping.upperBoneId, length: mapping.length },
      { boneId: mapping.lowerBoneId, length: mapping.length }
    ]),
    error: null
  };
}

export function supportsProductionIK(character: CharacterEntity): boolean {
  const definition = getRigDefinition(character.rigPreset);
  return (definition.id === "steve" || definition.id === "alex") &&
    Object.values(PLAYER_LIMB_MAPPINGS).every((mapping) =>
      definition.bones.some((bone) => bone.id === mapping.upperBoneId) &&
      definition.bones.some((bone) => bone.id === mapping.lowerBoneId)
    );
}

function failure(error: string): RigIKMappingResult {
  return { ok: false, chain: null, error };
}
