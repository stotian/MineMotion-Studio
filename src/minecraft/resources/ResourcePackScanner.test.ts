import { describe, expect, it } from "vitest";
import { ResourcePackScanner } from "./ResourcePackScanner";

const encoder = new TextEncoder();

describe("ResourcePackScanner", () => {
  it("parses pack metadata and block textures below a selected root folder", () => {
    const scan = ResourcePackScanner.scan([
      {
        path: "My Pack/pack.mcmeta",
        bytes: encoder.encode(
          JSON.stringify({
            pack: {
              pack_format: 34,
              description: { text: "Cinematic Blocks" }
            }
          })
        )
      },
      {
        path: "My Pack/assets/minecraft/textures/block/stone.png",
        bytes: new Uint8Array([137, 80, 78, 71])
      },
      {
        path: "My Pack/assets/minecraft/textures/block/water_still.png.mcmeta",
        bytes: encoder.encode("{}")
      },
      {
        path: "My Pack/assets/minecraft/textures/block/water_still.png",
        bytes: new Uint8Array([137, 80, 78, 71])
      }
    ]);

    expect(scan.rootPath).toBe("My Pack/");
    expect(scan.metadata.packFormat).toBe(34);
    expect(scan.metadata.description).toBe("Cinematic Blocks");
    expect(scan.textures.map((texture) => texture.blockName)).toEqual([
      "stone",
      "water_still"
    ]);
    expect(scan.textures[1].animated).toBe(true);
  });

  it("keeps texture scanning available when pack.mcmeta is absent", () => {
    const scan = ResourcePackScanner.scan([
      {
        path: "assets/minecraft/textures/block/dirt.png",
        bytes: new Uint8Array([1])
      }
    ]);

    expect(scan.metadata.hasPackMetadata).toBe(false);
    expect(scan.textures).toHaveLength(1);
    expect(scan.warnings.join(" ")).toMatch(/pack\.mcmeta/i);
  });

  it("rejects invalid pack metadata JSON", () => {
    expect(() => ResourcePackScanner.parseMetadata("{broken"))
      .toThrow(/valid JSON/i);
  });
});
