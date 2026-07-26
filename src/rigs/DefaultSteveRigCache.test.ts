import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import { disposeThreeObjectTree } from "../renderer/ThreeResourceDisposal";
import {
  clearSteveRigTextureCache,
  createDefaultSteveRig,
  pruneSteveRigTextureCache,
  SteveRigTextureCache
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

  it("keeps skin texture ownership independent between renderers", () => {
    const textures = [new THREE.Texture(), new THREE.Texture()];
    vi.spyOn(THREE.TextureLoader.prototype, "load")
      .mockImplementation(() => textures.shift() ?? new THREE.Texture());
    const firstOwner = new SteveRigTextureCache();
    const secondOwner = new SteveRigTextureCache();
    const first = firstOwner.get("data:image/png;base64,shared");
    const second = secondOwner.get("data:image/png;base64,shared");
    const firstDispose = vi.spyOn(first, "dispose");
    const secondDispose = vi.spyOn(second, "dispose");

    expect(first).not.toBe(second);
    expect(firstOwner.clear()).toBe(1);
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).not.toHaveBeenCalled();
    expect(secondOwner.clear()).toBe(1);
    expect(secondDispose).toHaveBeenCalledOnce();
  });
});
