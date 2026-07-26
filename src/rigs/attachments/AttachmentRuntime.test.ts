import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { sampleProjectAnimationWithVfxTiming } from "../../vfx/runtime/VfxAnimationSampling";
import { createDefaultSteveRig } from "../DefaultSteveRig";
import { createInitialProject } from "../../project/ProjectStore";

describe("attachment runtime", () => {
  it("inherits authoritative production bone animation", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.attachments![0].visible = true;
    project.animation.tracks = [{
      id: `${character.id}:bone.rotation.rightForearm`,
      targetId: character.id,
      property: "bone.rotation.rightForearm",
      keyframes: [
        { frame: 0, value: [0, 0, 0] },
        { frame: 10, value: [0, 0, 90] }
      ]
    }];

    const startRig = createDefaultSteveRig(
      sampleProjectAnimationWithVfxTiming(project, 0).scene.characters[0]
    );
    const endRig = createDefaultSteveRig(
      sampleProjectAnimationWithVfxTiming(project, 10).scene.characters[0]
    );
    startRig.updateMatrixWorld(true);
    endRig.updateMatrixWorld(true);
    const start = startRig.getObjectByName("Sword Placeholder")!
      .getWorldPosition(new THREE.Vector3());
    const end = endRig.getObjectByName("Sword Placeholder")!
      .getWorldPosition(new THREE.Vector3());

    expect(start.distanceTo(end)).toBeGreaterThan(0.5);
    expect(end.toArray().every(Number.isFinite)).toBe(true);
  });

  it("uses the resolved imported OBJ instead of the generic cube fallback", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.attachments = [{
      id: "attachment_custom",
      name: "Custom Tool",
      pointId: "rightHand",
      kind: "obj",
      assetId: "asset_tool",
      visible: true
    }];
    const resolved = new THREE.Group();
    resolved.userData.source = "obj";
    resolved.add(new THREE.Mesh(new THREE.BufferGeometry()));
    const resolver = vi.fn(() => resolved);

    const rig = createDefaultSteveRig(character, resolver);
    const object = rig.getObjectByName("Custom Tool");

    expect(resolver).toHaveBeenCalledWith("asset_tool");
    expect(object).toBe(resolved);
    expect(object?.userData.source).toBe("obj");
  });
});
