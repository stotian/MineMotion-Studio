import { beforeEach, describe, expect, it } from "vitest";
import {
  blockRegistrySize,
  getBlockDefinition,
  isKnownBlock,
  listBlockIdsByNamespace,
  listBlockSources,
  listRenderableBlockIds,
  normalizeBlockId,
  registerBlockSource,
  registerBlocks,
  resetBlockRegistry,
  splitBlockId,
  unregisterNamespace
} from "./BlockRegistry";
import { ensureVanillaBlocksRegistered, resetVanillaSeed } from "./BlockCatalogue";
import { createVanillaBlockCatalogue } from "./VanillaBlocks";

describe("block registry", () => {
  beforeEach(() => {
    resetBlockRegistry();
    resetVanillaSeed();
  });

  it("normalizes bare ids into the minecraft namespace", () => {
    // Projects saved before ids were namespaced still store "stone".
    expect(normalizeBlockId("stone")).toBe("minecraft:stone");
    expect(normalizeBlockId("minecraft:stone")).toBe("minecraft:stone");
    expect(normalizeBlockId("  STONE ")).toBe("minecraft:stone");
    expect(normalizeBlockId("create:cogwheel")).toBe("create:cogwheel");
  });

  it("splits ids into namespace and path", () => {
    expect(splitBlockId("create:cogwheel")).toEqual({ namespace: "create", path: "cogwheel" });
    expect(splitBlockId("stone")).toEqual({ namespace: "minecraft", path: "stone" });
  });

  it("returns a visible placeholder instead of null for unknown ids", () => {
    const unknown = getBlockDefinition("nope:missing");
    expect(unknown.label).toBe("Unknown block");
    expect(unknown.opacity).toBe(1);
    expect(isKnownBlock("nope:missing")).toBe(false);
  });

  it("lets a later registration override an earlier one", () => {
    registerBlocks([{ id: "stone", label: "Stone", color: "#111111", transparent: false, opacity: 1 }]);
    registerBlocks([{ id: "minecraft:stone", label: "Restyled", color: "#222222", transparent: false, opacity: 1 }]);

    expect(getBlockDefinition("stone").label).toBe("Restyled");
    expect(blockRegistrySize()).toBe(1);
  });

  it("removes only the namespace being unregistered", () => {
    registerBlockSource({ namespace: "create", label: "Create", kind: "mod" });
    registerBlocks([
      { id: "minecraft:stone", label: "Stone", color: "#7d7d7d", transparent: false, opacity: 1 },
      { id: "create:cogwheel", label: "Cogwheel", color: "#a0794a", transparent: false, opacity: 1 }
    ]);

    expect(unregisterNamespace("create")).toBe(1);
    expect(isKnownBlock("create:cogwheel")).toBe(false);
    expect(isKnownBlock("minecraft:stone")).toBe(true);
    expect(listBlockSources().some((source) => source.namespace === "create")).toBe(false);
  });

  it("omits fully transparent blocks from the renderable list", () => {
    registerBlocks([
      { id: "minecraft:air", label: "Air", color: "#000000", transparent: true, opacity: 0 },
      { id: "minecraft:stone", label: "Stone", color: "#7d7d7d", transparent: false, opacity: 1 }
    ]);

    const renderable = listRenderableBlockIds();
    expect(renderable).toContain("minecraft:stone");
    expect(renderable).not.toContain("minecraft:air");
  });
});

describe("vanilla catalogue", () => {
  beforeEach(() => {
    resetBlockRegistry();
    resetVanillaSeed();
  });

  it("registers a catalogue of the expected scale", () => {
    const count = ensureVanillaBlocksRegistered();
    // Guards against a family generator silently collapsing to a handful.
    expect(count).toBeGreaterThan(700);
  });

  it("is free of duplicate ids", () => {
    const catalogue = createVanillaBlockCatalogue();
    const ids = new Set(catalogue.map((definition) => definition.id));
    expect(ids.size).toBe(catalogue.length);
  });

  it("namespaces every entry and uses valid hex colours", () => {
    for (const definition of createVanillaBlockCatalogue()) {
      expect(definition.id.startsWith("minecraft:")).toBe(true);
      expect(definition.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(definition.label.length).toBeGreaterThan(0);
    }
  });

  it("keeps the blocks the old closed union carried", () => {
    ensureVanillaBlocksRegistered();
    for (const id of ["air", "grass_block", "dirt", "stone", "water", "sand", "oak_planks", "glass"]) {
      expect(isKnownBlock(id)).toBe(true);
    }
  });

  it("carries the blocks 26.2 added", () => {
    ensureVanillaBlocksRegistered();
    // Ids verified against the 26.2 ("Chaos Cubed") block list, including the
    // "bricks" -> "brick" rename the shape generator has to get right.
    const expected = [
      "cinnabar", "cinnabar_stairs", "cinnabar_slab", "cinnabar_wall",
      "polished_cinnabar", "polished_cinnabar_stairs", "polished_cinnabar_slab",
      "polished_cinnabar_wall", "cinnabar_bricks", "cinnabar_brick_stairs",
      "cinnabar_brick_slab", "cinnabar_brick_wall", "chiseled_cinnabar",
      "sulfur", "sulfur_stairs", "sulfur_slab", "sulfur_wall",
      "polished_sulfur", "polished_sulfur_stairs", "polished_sulfur_slab",
      "polished_sulfur_wall", "sulfur_bricks", "sulfur_brick_stairs",
      "sulfur_brick_slab", "sulfur_brick_wall", "chiseled_sulfur",
      "potent_sulfur", "sulfur_spike"
    ];
    for (const id of expected) {
      expect(isKnownBlock(id), `missing ${id}`).toBe(true);
    }
  });

  it("seeds only once", () => {
    const first = ensureVanillaBlocksRegistered();
    const second = ensureVanillaBlocksRegistered();
    expect(second).toBe(first);
  });

  it("groups the catalogue under the minecraft namespace", () => {
    ensureVanillaBlocksRegistered();
    expect(listBlockIdsByNamespace("minecraft").length).toBe(blockRegistrySize());
  });
});
