import { describe, expect, it } from "vitest";
import type { ResourcePackEntry } from "../resources/ResourcePackTypes";
import { readModContents, readModMetadata } from "./ModJarReader";

const encoder = new TextEncoder();

function file(path: string, text: string): ResourcePackEntry {
  return { path, bytes: encoder.encode(text) };
}

function png(path: string): ResourcePackEntry {
  // Only the presence and bytes matter here, not a decodable image.
  return { path, bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) };
}

const FABRIC_MANIFEST = JSON.stringify({
  id: "create",
  name: "Create",
  version: "0.5.1",
  authors: ["simibubi", { name: "Team Create" }],
  description: "Building tools and aesthetic technology."
});

const FORGE_MANIFEST = `
modLoader="javafml"
loaderVersion="[47,)"

[[mods]]
modId="jei"
displayName="Just Enough Items"
version="15.2.0"
authors="mezz"
description="Item and recipe viewing."
`;

const QUILT_MANIFEST = JSON.stringify({
  quilt_loader: {
    id: "quiltmod",
    version: "1.2.3",
    metadata: {
      name: "Quilt Mod",
      description: "A quilt example.",
      contributors: { Alice: "Owner", Bob: "Contributor" }
    }
  }
});

describe("mod metadata", () => {
  it("reads a Fabric manifest", () => {
    const metadata = readModMetadata([file("fabric.mod.json", FABRIC_MANIFEST)]);

    expect(metadata.modId).toBe("create");
    expect(metadata.name).toBe("Create");
    expect(metadata.version).toBe("0.5.1");
    expect(metadata.loader).toBe("fabric");
    // Authors come as strings or objects; both shapes must survive.
    expect(metadata.authors).toEqual(["simibubi", "Team Create"]);
  });

  it("reads a Forge mods.toml", () => {
    const metadata = readModMetadata([file("META-INF/mods.toml", FORGE_MANIFEST)]);

    expect(metadata.modId).toBe("jei");
    expect(metadata.name).toBe("Just Enough Items");
    expect(metadata.version).toBe("15.2.0");
    expect(metadata.loader).toBe("forge");
    expect(metadata.authors).toEqual(["mezz"]);
  });

  it("distinguishes NeoForge from Forge by its manifest path", () => {
    const metadata = readModMetadata([file("META-INF/neoforge.mods.toml", FORGE_MANIFEST)]);
    expect(metadata.loader).toBe("neoforge");
  });

  it("reads a Quilt manifest", () => {
    const metadata = readModMetadata([file("quilt.mod.json", QUILT_MANIFEST)]);

    expect(metadata.modId).toBe("quiltmod");
    expect(metadata.name).toBe("Quilt Mod");
    expect(metadata.loader).toBe("quilt");
    expect(metadata.authors).toEqual(["Alice", "Bob"]);
  });

  it("falls back to the assets namespace when no manifest exists", () => {
    const metadata = readModMetadata([png("assets/mystery/textures/block/thing.png")]);

    expect(metadata.modId).toBe("mystery");
    expect(metadata.loader).toBe("unknown");
  });

  it("skips a malformed manifest rather than throwing", () => {
    const metadata = readModMetadata([
      file("fabric.mod.json", "{ not json"),
      file("META-INF/mods.toml", FORGE_MANIFEST)
    ]);

    expect(metadata.modId).toBe("jei");
    expect(metadata.loader).toBe("forge");
  });
});

describe("mod contents", () => {
  const jar: ResourcePackEntry[] = [
    file("fabric.mod.json", FABRIC_MANIFEST),
    file("assets/create/blockstates/cogwheel.json", "{}"),
    file("assets/create/blockstates/large_cogwheel.json", "{}"),
    file("assets/create/models/item/wrench.json", "{}"),
    file("assets/create/models/item/goggles.json", "{}"),
    png("assets/create/textures/block/cogwheel.png"),
    file("assets/create/lang/en_us.json", "{}"),
    // Entities are out of scope: they need a rig, not a block definition.
    file("assets/create/models/entity/contraption.json", "{}")
  ];

  it("derives block ids from blockstates", () => {
    const contents = readModContents(jar);

    expect(contents.blocks.map((block) => block.id)).toEqual([
      "create:cogwheel",
      "create:large_cogwheel"
    ]);
    expect(contents.blocks[1].label).toBe("Large Cogwheel");
  });

  it("collects item ids and textures, and ignores entity models", () => {
    const contents = readModContents(jar);

    expect(contents.itemIds.sort()).toEqual(["create:goggles", "create:wrench"]);
    expect(contents.textures.has("create:block/cogwheel")).toBe(true);
    expect(contents.itemIds.some((id) => id.includes("contraption"))).toBe(false);
  });

  it("gives each block a distinct, repeatable placeholder colour", () => {
    const first = readModContents(jar).blocks;
    const second = readModContents(jar).blocks;

    expect(first[0].color).toMatch(/^#[0-9a-f]{6}$/);
    expect(first[0].color).not.toBe(first[1].color);
    // Same input must always produce the same colour, or scenes would shift.
    expect(second[0].color).toBe(first[0].color);
  });

  it("warns when a jar carries no blocks", () => {
    const contents = readModContents([file("fabric.mod.json", FABRIC_MANIFEST)]);

    expect(contents.blocks).toHaveLength(0);
    expect(contents.warnings.join(" ")).toMatch(/no blockstates/i);
  });

  it("does not duplicate a block declared twice", () => {
    const contents = readModContents([
      ...jar,
      file("assets/create/blockstates/cogwheel.json", "{}")
    ]);

    expect(contents.blocks.filter((block) => block.id === "create:cogwheel")).toHaveLength(1);
  });
});
