import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMinecraftMaterialCache,
  createMinecraftMaterialContextSignature,
  getMaterialForBlock,
  MinecraftMaterialCache,
  resolveAnimationFrame,
  type MinecraftMaterialContext
} from "./MinecraftMaterialSystem";
import {
  DEFAULT_MINECRAFT_MATERIAL_SETTINGS
} from "../minecraft/materials/MinecraftMaterialPresets";
import type {
  MinecraftMaterialSettings
} from "../minecraft/materials/MinecraftMaterialTypes";
import { DEFAULT_BIOME_TINT } from "../minecraft/resources/BiomeTint";
import type { ResourcePackAsset } from "../minecraft/resources/ResourcePackTypes";

function context(
  defaultPresetId: "solid" | "water",
  overrides: MinecraftMaterialSettings["overrides"] = {}
): MinecraftMaterialContext {
  return {
    settings: {
      activeResourcePackId: null,
      textureFiltering: "nearest",
      biomeTint: { ...DEFAULT_BIOME_TINT },
      materials: {
        ...DEFAULT_MINECRAFT_MATERIAL_SETTINGS,
        defaultPresetId,
        overrides
      },
      water: {
        opacity: 0.58,
        roughness: 0.24,
        animationSpeed: 1,
        emissiveIntensity: 0
      }
    }
  };
}

afterEach(() => {
  clearMinecraftMaterialCache();
  vi.restoreAllMocks();
});

describe("Minecraft material cache", () => {
  it("keeps per-face materials separate and resolves deterministic animation frames", () => {
    const materialContext = context("solid");
    const top = getMaterialForBlock("grass_block", materialContext, "top");
    const side = getMaterialForBlock("grass_block", materialContext, "side");
    expect(top).not.toBe(side);
    expect(resolveAnimationFrame({
      frameTimeTicks: 2,
      interpolate: false,
      frames: [{ index: 0 }, { index: 2, timeTicks: 4 }]
    }, 4, 99)).toBe(0);
    expect(resolveAnimationFrame({
      frameTimeTicks: 2,
      interpolate: false,
      frames: [{ index: 0 }, { index: 2, timeTicks: 4 }]
    }, 4, 100)).toBe(2);
  });
  it("includes default material settings in cache identity", () => {
    const solid = getMaterialForBlock("stone", context("solid"));
    const water = getMaterialForBlock("stone", context("water"));

    expect(water).not.toBe(solid);
    expect(solid.transparent).toBe(false);
    expect(water.transparent).toBe(true);
  });

  it("reuses one material for an unchanged renderer context", () => {
    const materialContext = context("solid");
    const first = getMaterialForBlock("stone", materialContext);
    const second = getMaterialForBlock("stone", materialContext);

    expect(second).toBe(first);
    expect(clearMinecraftMaterialCache()).toEqual({
      materials: 1,
      textures: 0
    });
  });

  it("creates stable signatures independent of override insertion order", () => {
    const first = context("solid", {
      stone: "glass",
      grass: "leaves"
    });
    const second = context("solid", {
      grass: "leaves",
      stone: "glass"
    });

    expect(createMinecraftMaterialContextSignature(first)).toBe(
      createMinecraftMaterialContextSignature(second)
    );
  });

  it("disposes cached materials exactly once", () => {
    const material = getMaterialForBlock("stone", context("solid"));
    const dispose = vi.spyOn(material, "dispose");

    expect(clearMinecraftMaterialCache()).toEqual({
      materials: 1,
      textures: 0
    });
    expect(dispose).toHaveBeenCalledOnce();
    expect(clearMinecraftMaterialCache()).toEqual({
      materials: 0,
      textures: 0
    });
  });

  it("keeps cache ownership independent between renderer instances", () => {
    const firstOwner = new MinecraftMaterialCache();
    const secondOwner = new MinecraftMaterialCache();
    const first = getMaterialForBlock("stone", {
      ...context("solid"),
      materialCache: firstOwner
    });
    const second = getMaterialForBlock("stone", {
      ...context("solid"),
      materialCache: secondOwner
    });
    const firstDispose = vi.spyOn(first, "dispose");
    const secondDispose = vi.spyOn(second, "dispose");

    expect(first).not.toBe(second);
    expect(firstOwner.clear()).toEqual({ materials: 1, textures: 0 });
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).not.toHaveBeenCalled();
    expect(secondOwner.clear()).toEqual({ materials: 1, textures: 0 });
    expect(secondDispose).toHaveBeenCalledOnce();
  });

  it("does not release another renderer's identical resource-pack texture", () => {
    const loadedTextures = [new THREE.Texture(), new THREE.Texture()];
    vi.spyOn(THREE.TextureLoader.prototype, "load")
      .mockImplementation(() => loadedTextures.shift() ?? new THREE.Texture());
    const pack: ResourcePackAsset = {
      id: "pack_test",
      name: "Test",
      sourceKind: "folder",
      metadata: {
        packFormat: 34,
        description: "Test",
        hasPackMetadata: true
      },
      textures: [
        {
          id: "texture_stone",
          path: "assets/minecraft/textures/block/stone.png",
          blockName: "stone",
          mimeType: "image/png",
          dataUrl: "data:image/png;base64,AA==",
          byteLength: 1,
          animated: false
        }
      ],
      importedAt: "2026-07-26T00:00:00.000Z",
      warnings: []
    };
    const firstOwner = new MinecraftMaterialCache();
    const secondOwner = new MinecraftMaterialCache();
    const first = getMaterialForBlock("stone", {
      ...context("solid"),
      resourcePack: pack,
      materialCache: firstOwner
    });
    const second = getMaterialForBlock("stone", {
      ...context("solid"),
      resourcePack: pack,
      materialCache: secondOwner
    });
    const firstTexture = first.map!;
    const secondTexture = second.map!;
    const firstDispose = vi.spyOn(firstTexture, "dispose");
    const secondDispose = vi.spyOn(secondTexture, "dispose");

    expect(firstTexture).not.toBe(secondTexture);
    expect(firstOwner.clear()).toEqual({ materials: 1, textures: 1 });
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).not.toHaveBeenCalled();
    expect(secondOwner.clear()).toEqual({ materials: 1, textures: 1 });
    expect(secondDispose).toHaveBeenCalledOnce();
  });
});
