import { describe, expect, it } from "vitest";
import { getBlockDefinition, listRenderableBlockIds } from "./BlockPalette";

describe("BlockPalette", () => {
  it("contains required Phase 1 block types", () => {
    expect(getBlockDefinition("grass").color).toMatch(/^#/);
    expect(getBlockDefinition("water").transparent).toBe(true);
    expect(listRenderableBlockIds()).toContain("stone");
    expect(listRenderableBlockIds()).not.toContain("air");
  });
});

