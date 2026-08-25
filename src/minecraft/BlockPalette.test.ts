import { describe, expect, it } from "vitest";
import { getBlockDefinition, listRenderableBlockIds } from "./BlockPalette";

describe("BlockPalette", () => {
  it("resolves the core block types by their bare ids", () => {
    // Bare ids are what chunk data and older projects carry; they must keep
    // resolving now that the registry stores everything namespaced.
    expect(getBlockDefinition("grass").color).toMatch(/^#/);
    expect(getBlockDefinition("water").transparent).toBe(true);
    expect(getBlockDefinition("stone").label).toBe("Stone");
  });

  it("keeps the seed colours the original palette defined", () => {
    // The vanilla catalogue only approximates colours. Existing projects were
    // authored against these, so the seed must win rather than restyle a scene.
    expect(getBlockDefinition("netherrack").color).toBe("#743030");
  });

  it("lists renderable blocks with namespaced ids, excluding air", () => {
    const ids = listRenderableBlockIds();

    // The list now answers from the registry, so ids are namespaced — that is
    // the change that lets mod blocks ("create:cogwheel") coexist with vanilla.
    expect(ids).toContain("minecraft:stone");
    expect(ids).not.toContain("minecraft:air");
    expect(ids).not.toContain("air");
  });

  it("exposes the whole catalogue, not just the seed record", () => {
    // Guards the wiring: if the palette stopped delegating to the registry this
    // would collapse back to roughly twenty entries.
    expect(listRenderableBlockIds().length).toBeGreaterThan(700);
  });
});
