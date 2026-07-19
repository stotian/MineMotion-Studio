import { describe, expect, it } from "vitest";
import { createStoredZip, type ZipEntry } from "../../export/ZipWriter";
import { createBlankVfxAuthoringDocument } from "../authoring/VfxAuthoringDocument";
import {
  applyVfxAuthoringCommand,
  createDefaultVfxAuthoringStackItem
} from "../authoring/VfxAuthoringController";
import { readVfxPackageArchive, VfxPackageFormatError } from "./VfxPackageArchiveReader";
import {
  VFX_PACKAGE_FORMAT,
  VFX_PACKAGE_MANIFEST_VERSION,
  type VfxPackageManifestV1
} from "./VfxPackageTypes";
import { validateVfxPackageManifest } from "./VfxPackageValidator";

const encoder = new TextEncoder();

function findSignature(bytes: Uint8Array, signature: ArrayLike<number>): number {
  return bytes.findIndex((_, index) => {
    for (let part = 0; part < signature.length; part += 1) {
      if (bytes[index + part] !== signature[part]) return false;
    }
    return true;
  });
}

function manifest(overrides: Partial<VfxPackageManifestV1> = {}): VfxPackageManifestV1 {
  return {
    format: VFX_PACKAGE_FORMAT,
    manifestVersion: VFX_PACKAGE_MANIFEST_VERSION,
    packageVersion: "1.0.0",
    minStudioVersion: "0.8.2",
    id: "example.safe-vfx",
    displayName: "Safe Example",
    description: "A declarative test package.",
    author: "MineMotion Tests",
    license: "MIT",
    effect: { path: "effect.json", documentId: "vfx-draft" },
    dependencies: [],
    permissions: [],
    assets: [],
    ...overrides
  };
}

async function archive(
  packageManifest: VfxPackageManifestV1 = manifest(),
  extras: ZipEntry[] = [],
  effect: unknown = createBlankVfxAuthoringDocument()
): Promise<ArrayBuffer> {
  return createStoredZip([
    { filename: "manifest.json", data: encoder.encode(JSON.stringify(packageManifest)), date: new Date(0) },
    { filename: "effect.json", data: encoder.encode(JSON.stringify(effect)), date: new Date(0) },
    ...extras.map((entry) => ({ ...entry, date: new Date(0) }))
  ]).arrayBuffer();
}

describe(".minemotion-vfx package safety", () => {
  it("reads a valid bounded manifest and authoring document", async () => {
    const result = await readVfxPackageArchive(await archive());
    expect(result.manifest.id).toBe("example.safe-vfx");
    expect(result.document.id).toBe("vfx-draft");
    expect(result.entries.map((entry) => entry.path)).toEqual(["manifest.json", "effect.json"]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("rejects traversal, executable files, case-folded duplicates, and undeclared files", async () => {
    const cases: ZipEntry[][] = [
      [{ filename: "../escape.json", data: new Uint8Array() }],
      [{ filename: "assets/run.js", data: encoder.encode("alert(1)") }],
      [{ filename: "MANIFEST.JSON", data: encoder.encode("{}") }],
      [{ filename: "assets/orphan.json", data: encoder.encode("{}") }]
    ];
    for (const extras of cases) {
      await expect(readVfxPackageArchive(await archive(manifest(), extras))).rejects.toBeInstanceOf(VfxPackageFormatError);
    }
  });

  it("rejects too many entries, corrupt checksums, and future Studio requirements", async () => {
    const many = Array.from({ length: 255 }, (_, index) => ({ filename: `assets/${index}.json`, data: new Uint8Array() }));
    await expect(readVfxPackageArchive(await archive(manifest(), many))).rejects.toThrow("too many entries");

    const corrupt = new Uint8Array(await archive());
    const marker = encoder.encode("minemotion-vfx");
    const offset = findSignature(corrupt, marker);
    expect(offset).toBeGreaterThan(0);
    corrupt[offset] ^= 1;
    await expect(readVfxPackageArchive(corrupt.buffer)).rejects.toThrow("checksum mismatch");

    await expect(readVfxPackageArchive(await archive(manifest({ minStudioVersion: "99.0.0" })))).rejects.toThrow("requires MineMotion Studio");
    await expect(readVfxPackageArchive(await archive({ ...manifest(), manifestVersion: 99 as 1 }))).rejects.toThrow("version is unsupported");
  });

  it("rejects forged compressed and uncompressed entry sizes before extraction", async () => {
    for (const fieldOffset of [20, 24]) {
      const forged = new Uint8Array(await archive());
      const central = findSignature(forged, [0x50, 0x4b, 0x01, 0x02]);
      expect(central).toBeGreaterThan(0);
      new DataView(forged.buffer).setUint32(central + fieldOffset, 17 * 1024 * 1024, true);
      await expect(readVfxPackageArchive(forged.buffer)).rejects.toThrow("16 MB limit");
    }
  });

  it("validates permissions, dependencies, licenses, dimensions, and closed fields", () => {
    expect(validateVfxPackageManifest(manifest()).ok).toBe(true);
    expect(validateVfxPackageManifest({ ...manifest(), license: "not a license with spaces" }).ok).toBe(false);
    expect(validateVfxPackageManifest({ ...manifest(), permissions: ["network"] }).ok).toBe(false);
    expect(validateVfxPackageManifest({ ...manifest(), dependencies: [{ id: "example.safe-vfx", versionRange: "^1.0.0", optional: false }] }).ok).toBe(false);
    expect(validateVfxPackageManifest({ ...manifest(), script: "alert(1)" }).ok).toBe(false);
    expect(validateVfxPackageManifest(manifest({
      permissions: ["asset-textures"],
      assets: [{ id: "huge", path: "assets/huge.png", kind: "texture", mimeType: "image/png", byteLength: 4, width: 4097, height: 1 }]
    })).ok).toBe(false);
  });

  it("requires exact declared assets, byte lengths, permissions, and PNG dimensions", async () => {
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (character) => character.charCodeAt(0));
    const asset = { id: "spark", path: "assets/spark.png", kind: "texture" as const, mimeType: "image/png", byteLength: png.byteLength, width: 1, height: 1 };
    const validManifest = manifest({ permissions: ["asset-textures"], assets: [asset] });
    const result = await readVfxPackageArchive(await archive(validManifest, [{ filename: asset.path, data: png }]));
    expect(result.entries).toHaveLength(3);
    await expect(readVfxPackageArchive(await archive({ ...validManifest, assets: [{ ...asset, width: 2 }] }, [{ filename: asset.path, data: png }]))).rejects.toThrow("dimensions");
    await expect(readVfxPackageArchive(await archive({ ...validManifest, assets: [{ ...asset, byteLength: png.byteLength - 1 }] }, [{ filename: asset.path, data: png }]))).rejects.toThrow("byte length mismatch");
    expect(validateVfxPackageManifest(manifest({ assets: [asset] })).ok).toBe(false);
  });

  it("rejects authoring documents that exceed compiled runtime budgets", async () => {
    let document = createBlankVfxAuthoringDocument();
    for (let index = 0; index < 5; index += 1) {
      const item = createDefaultVfxAuthoringStackItem("particle-emitter", `dense:${index}`);
      if (item.kind !== "emitter") throw new Error("Expected emitter");
      const result = applyVfxAuthoringCommand(document, {
        type: "add",
        item: { ...item, descriptor: { ...item.descriptor, count: 1_024 } }
      });
      if (!result.ok) throw new Error("Could not build dense package fixture");
      document = result.value.document;
    }
    await expect(readVfxPackageArchive(await archive(manifest(), [], document))).rejects.toThrow("budgets");
  });
});
