import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import { disposeThreeObjectTree } from "../renderer/ThreeResourceDisposal";
import {
  clearSteveRigTextureCache,
  createDefaultSteveRig,
  pruneSteveRigTextureCache
} from "./DefaultSteveRig";

afterEach(() => {
  clearSteveRigTextureCache();
  vi.restoreAllMocks();
});

describe("Steve rig texture cache ownership", () => {
  it("retains active skins and disposes skins removed from the project", () => {
    const texture = new THREE.Texture();
    const dispose = vi.spyOn(texture, "dispose");
    const load = vi.spyOn(
      THREE.TextureLoader.prototype,
      "load"
    ).mockReturnValue(texture);
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.skin = {
      id: "skin_a",
      name: "Skin A",
      dataUrl: "data:image/png;base64,skin-a",
      importedAt: "2026-07-26T00:00:00.000Z",
      metadata: {
        width: 64,
        height: 64,
        valid: true,
        legacy: false,
        modelType: "steve",
        warnings: []
      }
    };
    const rig = createDefaultSteveRig(character);
    const secondRig = createDefaultSteveRig(character);
    disposeThreeObjectTree(rig);
    disposeThreeObjectTree(secondRig);

    expect(load).toHaveBeenCalledOnce();
    expect(pruneSteveRigTextureCache([character.skin.dataUrl])).toBe(0);
    expect(dispose).not.toHaveBeenCalled();
    expect(pruneSteveRigTextureCache([])).toBe(1);
    expect(dispose).toHaveBeenCalledOnce();
    expect(clearSteveRigTextureCache()).toBe(0);
  });
});
