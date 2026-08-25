import { beforeEach, describe, expect, it } from "vitest";
import {
  getBlockDefinition,
  isKnownBlock,
  listBlockIdsByNamespace,
  listBlockSources,
  resetBlockRegistry
} from "../blocks/BlockRegistry";
import { ensureVanillaBlocksRegistered, resetVanillaSeed } from "../blocks/BlockCatalogue";
import type { ModContents } from "./ModJarReader";
import {
  installModContents,
  isModInstalled,
  listInstalledMods,
  resetModLibrary,
  uninstallMod
} from "./ModLibrary";

function contents(modId: string, blockPaths: string[], version = "1.0.0"): ModContents {
  return {
    metadata: {
      modId,
      name: modId.toUpperCase(),
      version,
      loader: "fabric",
      authors: [],
      description: ""
    },
    blocks: blockPaths.map((path) => ({
      id: `${modId}:${path}`,
      label: path,
      color: "#808080",
      transparent: false,
      opacity: 1
    })),
    itemIds: [`${modId}:wrench`],
    textures: new Map(),
    warnings: []
  };
}

describe("mod library", () => {
  beforeEach(() => {
    resetModLibrary();
    resetBlockRegistry();
    resetVanillaSeed();
  });

  it("registers a mod's blocks into the registry", () => {
    const record = installModContents(contents("create", ["cogwheel", "shaft"]));

    expect(record.blockCount).toBe(2);
    expect(isKnownBlock("create:cogwheel")).toBe(true);
    expect(getBlockDefinition("create:shaft").label).toBe("shaft");
  });

  it("lists the mod as an installed source", () => {
    installModContents(contents("create", ["cogwheel"]));

    expect(isModInstalled("create")).toBe(true);
    expect(listInstalledMods()).toHaveLength(1);
    expect(listBlockSources().some((s) => s.namespace === "create" && s.kind === "mod")).toBe(true);
  });

  it("replaces rather than layers when a mod is re-installed", () => {
    installModContents(contents("create", ["cogwheel", "shaft"], "1.0.0"));
    installModContents(contents("create", ["cogwheel"], "2.0.0"));

    // The removed block must be gone, not left behind by the older version.
    expect(isKnownBlock("create:shaft")).toBe(false);
    expect(listBlockIdsByNamespace("create")).toHaveLength(1);
    expect(listInstalledMods()[0].metadata.version).toBe("2.0.0");
  });

  it("uninstalling removes only that mod's blocks", () => {
    ensureVanillaBlocksRegistered();
    installModContents(contents("create", ["cogwheel"]));
    installModContents(contents("jei", ["cheat_panel"]));

    expect(uninstallMod("create")).toBe(true);

    expect(isKnownBlock("create:cogwheel")).toBe(false);
    expect(isKnownBlock("jei:cheat_panel")).toBe(true);
    expect(isKnownBlock("minecraft:stone")).toBe(true);
    expect(listInstalledMods()).toHaveLength(1);
  });

  it("reports false when uninstalling something absent", () => {
    expect(uninstallMod("nope")).toBe(false);
  });

  it("lets vanilla and mod blocks coexist", () => {
    ensureVanillaBlocksRegistered();
    installModContents(contents("create", ["cogwheel"]));

    expect(isKnownBlock("minecraft:cinnabar")).toBe(true);
    expect(isKnownBlock("create:cogwheel")).toBe(true);
  });

  it("carries reader warnings onto the installed record", () => {
    const empty = contents("lib", []);
    empty.warnings = ["No blockstates found."];

    expect(installModContents(empty).warnings).toEqual(["No blockstates found."]);
  });
});
