import { describe, expect, it } from "vitest";
import { TextureAtlasBuilder } from "./TextureAtlasBuilder";
import type { ResourcePackTextureAsset } from "./ResourcePackTypes";

function texture(index: number): ResourcePackTextureAsset {
  return {
    id: `texture_${index}`,
    path: `assets/minecraft/textures/block/block_${index}.png`,
    blockName: `block_${index}`,
    mimeType: "image/png",
    dataUrl: "data:image/png;base64,AA==",
    byteLength: 1,
    animated: false
  };
}

describe("TextureAtlasBuilder", () => {
  it("builds deterministic tile coordinates and normalized UVs", () => {
    const layout = TextureAtlasBuilder.createLayout(
      [texture(0), texture(1), texture(2)],
      16,
      2
    );

    expect(layout.width).toBe(32);
    expect(layout.height).toBe(32);
    expect(layout.entries[2].x).toBe(0);
    expect(layout.entries[2].y).toBe(16);
    expect(layout.entries[2].uv).toEqual([0, 0.5, 0.5, 1]);
  });
});
