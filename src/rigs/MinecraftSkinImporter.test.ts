import { describe, expect, it } from "vitest";
import { MinecraftSkinImporter, guessModelTypeFromName } from "./MinecraftSkinImporter";

describe("MinecraftSkinImporter", () => {
  it("accepts modern 64x64 Minecraft skins", () => {
    const metadata = MinecraftSkinImporter.validateDimensions(64, 64, "steve.png");

    expect(metadata.valid).toBe(true);
    expect(metadata.legacy).toBe(false);
    expect(metadata.modelType).toBe("steve");
  });

  it("accepts legacy 64x32 skins with a warning", () => {
    const metadata = MinecraftSkinImporter.validateDimensions(64, 32, "classic.png");

    expect(metadata.valid).toBe(true);
    expect(metadata.legacy).toBe(true);
    expect(metadata.warnings.join(" ")).toMatch(/legacy/i);
  });

  it("rejects non-Minecraft skin dimensions", () => {
    const metadata = MinecraftSkinImporter.validateDimensions(32, 32, "tiny.png");

    expect(metadata.valid).toBe(false);
    expect(metadata.warnings.join(" ")).toMatch(/64x64/i);
  });

  it("guesses Alex/slim skins from file name", () => {
    expect(guessModelTypeFromName("my_alex_slim_skin.png")).toBe("alex");
  });
});
