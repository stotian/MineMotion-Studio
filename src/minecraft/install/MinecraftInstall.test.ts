import { describe, expect, it } from "vitest";
import {
  checkInstall,
  compareVersionsDescending,
  defaultInstallPath,
  defaultTextureLocation,
  extractBlockTextures,
  versionJarPath
} from "./MinecraftInstall";

describe("install paths", () => {
  it("uses each platform's convention", () => {
    expect(defaultInstallPath("windows", "C:\\Users\\bob")).toBe(
      "C:\\Users\\bob\\AppData\\Roaming\\.minecraft"
    );
    expect(defaultInstallPath("macos", "/Users/bob")).toBe(
      "/Users/bob/Library/Application Support/minecraft"
    );
    expect(defaultInstallPath("linux", "/home/bob")).toBe("/home/bob/.minecraft");
  });

  it("builds a jar path with the separator the install uses", () => {
    expect(versionJarPath("C:\\games\\.minecraft", "26.2")).toBe(
      "C:\\games\\.minecraft\\versions\\26.2\\26.2.jar"
    );
    expect(versionJarPath("/home/bob/.minecraft", "26.2")).toBe(
      "/home/bob/.minecraft/versions/26.2/26.2.jar"
    );
  });
});

describe("install validation", () => {
  it("finds versions and reports success", () => {
    const result = checkInstall([
      "versions/26.2/26.2.jar",
      "versions/26.2/26.2.json",
      "versions/1.21.4/1.21.4.jar",
      "saves/World/level.dat"
    ]);

    expect(result.ok).toBe(true);
    expect(result.versions).toEqual(["26.2", "1.21.4"]);
  });

  it("handles Windows separators", () => {
    const result = checkInstall(["versions\\26.2\\26.2.jar"]);
    expect(result.versions).toEqual(["26.2"]);
  });

  it("explains what to point at when versions/ is missing", () => {
    const result = checkInstall(["mods/create.jar", "options.txt"]);

    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/\.minecraft folder itself/);
  });
});

describe("version ordering", () => {
  it("puts newer date-based versions first", () => {
    expect(["26.1", "26.2", "25.4"].sort(compareVersionsDescending)).toEqual([
      "26.2",
      "26.1",
      "25.4"
    ]);
  });

  it("orders legacy 1.x versions correctly, including double digits", () => {
    // 1.21 must beat 1.9: segment-wise numeric comparison, not string order.
    expect(["1.9", "1.21.4", "1.21"].sort(compareVersionsDescending)).toEqual([
      "1.21.4",
      "1.21",
      "1.9"
    ]);
  });

  it("sorts both schemes together without crashing", () => {
    const sorted = ["1.21", "26.2", "1.8.9"].sort(compareVersionsDescending);
    expect(sorted[0]).toBe("26.2");
  });
});

describe("texture extraction", () => {
  const bytes = new Uint8Array([1, 2, 3]);

  it("takes block textures and skips everything else", () => {
    const textures = extractBlockTextures([
      { path: "assets/minecraft/textures/block/stone.png", bytes },
      { path: "assets/minecraft/textures/item/apple.png", bytes },
      { path: "assets/minecraft/textures/entity/creeper/creeper.png", bytes },
      { path: "assets/minecraft/textures/gui/widgets.png", bytes },
      { path: "assets/minecraft/lang/en_us.json", bytes }
    ]);

    expect(textures).toHaveLength(1);
    expect(textures[0].location).toBe("minecraft:block/stone");
  });

  it("keeps a mod's own namespace", () => {
    const textures = extractBlockTextures([
      { path: "assets/create/textures/block/cogwheel.png", bytes }
    ]);

    expect(textures[0].location).toBe("create:block/cogwheel");
  });

  it("maps a block id to its conventional texture location", () => {
    expect(defaultTextureLocation("stone")).toBe("minecraft:block/stone");
    expect(defaultTextureLocation("minecraft:cinnabar")).toBe("minecraft:block/cinnabar");
    expect(defaultTextureLocation("create:cogwheel")).toBe("create:block/cogwheel");
  });
});
