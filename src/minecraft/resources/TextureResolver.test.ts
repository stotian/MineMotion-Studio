import { describe, expect, it } from "vitest";
import type { ResourcePackAsset } from "./ResourcePackTypes";
import { TextureResolver } from "./TextureResolver";

const pack: ResourcePackAsset = {
  id: "pack_test",
  name: "Test Pack",
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
  importedAt: new Date(0).toISOString(),
  warnings: []
};

describe("TextureResolver", () => {
  it("resolves an imported block texture", () => {
    const result = TextureResolver.resolve(pack, "stone");

    expect(result.status).toBe("resolved");
    expect(result.texture?.blockName).toBe("stone");
  });

  it("returns the palette fallback for a missing texture", () => {
    const result = TextureResolver.resolve(pack, "netherrack");

    expect(result.status).toBe("fallback");
    expect(result.texture).toBeNull();
    expect(result.fallbackColor).toBe("#743030");
  });

  it("returns a clear fallback when no pack is active", () => {
    const result = TextureResolver.resolve(null, "glass");

    expect(result.status).toBe("fallback");
    expect(result.reason).toMatch(/no active resource pack/i);
  });
});
