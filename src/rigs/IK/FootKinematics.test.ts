import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createInitialProject } from "../../project/ProjectStore";
import { createDefaultSteveRig } from "../DefaultSteveRig";
import { sampleFootKinematics, worldTargetToFootIKPosition } from "./FootKinematics";
import { createRigIKControlsForCharacter, resolveRigIKChain } from "./RigIKMapping";

describe("foot kinematics", () => {
  it("evaluates the neutral leg endpoint and round-trips it through world/local transforms", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const control = createRigIKControlsForCharacter(character).find((entry) => entry.limb === "leftLeg")!;
    const chain = resolveRigIKChain(character, control).chain!;
    const result = sampleFootKinematics(project, character.id, control, chain, 0);
    expect(result.ok).toBe(true);
    expect(result.sample!.worldPosition).toEqual([-0.2, 0.9700000000000002, 0]);
    expect(worldTargetToFootIKPosition(result.sample!, result.sample!.worldPosition)).toEqual([0, -1.2, 0]);
  });

  it("accounts for sampled character motion, scale, rotation, and root rotation", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.transform.position = [4, 3, -2];
    character.transform.rotation = [0, 90, 0];
    character.transform.scale = [2, 2, 2];
    character.boneRotations.root = [10, 20, 30];
    character.boneRotations.rightLeg = [15, -10, 25];
    character.boneRotations.rightLowerLeg = [30, 0, -5];
    const control = createRigIKControlsForCharacter(character).find((entry) => entry.limb === "rightLeg")!;
    const chain = resolveRigIKChain(character, control).chain!;
    const result = sampleFootKinematics(project, character.id, control, chain, 0);
    expect(result.ok).toBe(true);
    const renderedRig = createDefaultSteveRig(character);
    renderedRig.position.set(...character.transform.position);
    renderedRig.rotation.set(...character.transform.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]);
    renderedRig.scale.set(...character.transform.scale);
    renderedRig.updateMatrixWorld(true);
    const renderedLowerLeg = renderedRig.getObjectByName("Right Lower Leg")!;
    const renderedFoot = renderedLowerLeg.localToWorld(new THREE.Vector3(0, -0.6, 0));
    expect(result.sample!.worldPosition[0]).toBeCloseTo(renderedFoot.x, 8);
    expect(result.sample!.worldPosition[1]).toBeCloseTo(renderedFoot.y, 8);
    expect(result.sample!.worldPosition[2]).toBeCloseTo(renderedFoot.z, 8);
    const local = worldTargetToFootIKPosition(result.sample!, result.sample!.worldPosition)!;
    expect(local.every(Number.isFinite)).toBe(true);
  });

  it("fails closed for invalid frames, zero scale, and non-leg controls", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const controls = createRigIKControlsForCharacter(character);
    const leg = controls.find((entry) => entry.limb === "leftLeg")!;
    const legChain = resolveRigIKChain(character, leg).chain!;
    expect(sampleFootKinematics(project, character.id, leg, legChain, -1).error)
      .toContain("FOOT_LOCK_FRAME_INVALID");
    character.transform.scale = [1, 0, 1];
    expect(sampleFootKinematics(project, character.id, leg, legChain, 0).error)
      .toContain("FOOT_LOCK_TRANSFORM_INVALID");
    const arm = controls.find((entry) => entry.limb === "leftArm")!;
    const armChain = resolveRigIKChain(character, arm).chain!;
    expect(sampleFootKinematics(project, character.id, arm, armChain, 0).error)
      .toContain("FOOT_LOCK_LIMB_INVALID");
  });
});
