import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMinecraftMaterialCache,
  createMinecraftMaterialContextSignature,
  getMaterialForBlock,
  type MinecraftMaterialContext
} from "./MinecraftMaterialSystem";
import {
  DEFAULT_MINECRAFT_MATERIAL_SETTINGS
} from "../minecraft/materials/MinecraftMaterialPresets";
import type {
  MinecraftMaterialSettings
} from "../minecraft/materials/MinecraftMaterialTypes";
import { DEFAULT_BIOME_TINT } from "../minecraft/resources/BiomeTint";

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
      }
    }
  };
}

afterEach(() => {
  clearMinecraftMaterialCache();
});

describe("Minecraft material cache", () => {
  it("includes default material settings in cache identity", () => {
    const solid = getMaterialForBlock("stone", context("solid"));
    const water = getMaterialForBlock("stone", context("water"));

    expect(water).not.toBe(solid);
    expect(solid.transparent).toBe(false);
    expect(water.transparent).toBe(true);
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
});
