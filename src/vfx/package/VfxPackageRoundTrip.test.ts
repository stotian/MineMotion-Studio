import { describe, expect, it } from "vitest";
import { createBlankVfxAuthoringDocument } from "../authoring/VfxAuthoringDocument";
import { applyVfxAuthoringCommand, createDefaultVfxAuthoringStackItem } from "../authoring/VfxAuthoringController";
import { readVfxPackageArchive } from "./VfxPackageArchiveReader";
import { createVfxPackageManifest, writeVfxPackageArchive } from "./VfxPackageArchiveWriter";
import { compareVfxPackageVersions, inspectVfxPackage, satisfiesVfxPackageVersion } from "./VfxPackageInspection";

function bytes(blob: Blob): Promise<Uint8Array> {
  return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

describe("deterministic VFX package round trips and inspection", () => {
  it("writes byte-identical canonical archives and round-trips authoring data", async () => {
    let document = createBlankVfxAuthoringDocument("custom.spark", "Custom Spark");
    const added = applyVfxAuthoringCommand(document, { type: "add", item: createDefaultVfxAuthoringStackItem("particle-emitter", "particles:1") });
    if (!added.ok) throw new Error("Could not create package fixture");
    document = added.value.document;
    const manifest = createVfxPackageManifest(document, { author: "Creator", license: "CC0-1.0" });
    const first = await writeVfxPackageArchive({ manifest, document });
    const second = await writeVfxPackageArchive({ document: structuredClone(document), manifest: structuredClone(manifest) });
    expect(await bytes(first.blob)).toEqual(await bytes(second.blob));
    expect(first.filename).toBe("custom.spark.minemotion-vfx");
    const imported = await readVfxPackageArchive(await first.blob.arrayBuffer());
    expect(imported.document).toEqual(document);
    expect(imported.manifest).toEqual(manifest);
    const rewritten = await writeVfxPackageArchive({ manifest: imported.manifest, document: imported.document });
    expect(await bytes(rewritten.blob)).toEqual(await bytes(first.blob));
  });

  it("reports preview, budgets, permissions, licenses, and dependency readiness", async () => {
    const document = createBlankVfxAuthoringDocument("custom.report", "Report VFX");
    const manifest = createVfxPackageManifest(document, {
      author: "Creator",
      license: "MIT",
      dependencies: [
        { id: "required.pack", versionRange: "^1.2.0", optional: false },
        { id: "optional.pack", versionRange: "~2.1.0", optional: true }
      ]
    });
    const written = await writeVfxPackageArchive({ manifest, document });
    const imported = await readVfxPackageArchive(await written.blob.arrayBuffer());
    const missing = inspectVfxPackage(imported);
    expect(missing.installReady).toBe(false);
    expect(missing.dependencies.map((dependency) => dependency.status)).toEqual(["missing", "missing"]);
    const ready = inspectVfxPackage(imported, [{ id: "required.pack", version: "1.9.0" }]);
    expect(ready.installReady).toBe(true);
    expect(ready.license).toBe("MIT");
    expect(ready.previewDataUrl.startsWith("data:image/svg+xml")).toBe(true);
    expect(ready.primitiveCount).toBe(0);
  });

  it("canonicalizes manifest and archive asset order", async () => {
    const document = createBlankVfxAuthoringDocument("custom.assets", "Asset VFX");
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (character) => character.charCodeAt(0));
    const curve = new TextEncoder().encode("{\"points\":[0,1]}");
    const assets = [
      { id: "z-spark", path: "assets/z-spark.png", kind: "texture" as const, mimeType: "image/png", byteLength: png.byteLength, width: 1, height: 1, license: "CC0-1.0" },
      { id: "a-curve", path: "assets/a-curve.json", kind: "curve" as const, mimeType: "application/json", byteLength: curve.byteLength, license: "MIT" }
    ];
    const manifest = createVfxPackageManifest(document, {
      author: "Creator",
      license: "MIT",
      permissions: ["asset-textures"],
      assets
    });
    const first = await writeVfxPackageArchive({
      manifest: { ...manifest, assets: [...manifest.assets].reverse() },
      document,
      assets: [{ path: assets[0].path, bytes: png }, { path: assets[1].path, bytes: curve }]
    });
    const second = await writeVfxPackageArchive({
      manifest,
      document,
      assets: [{ path: assets[1].path, bytes: curve }, { path: assets[0].path, bytes: png }]
    });
    expect(await bytes(first.blob)).toEqual(await bytes(second.blob));
    const report = inspectVfxPackage(await readVfxPackageArchive(await first.blob.arrayBuffer()));
    expect(report.assetCount).toBe(2);
    expect(report.assetLicenses).toEqual(["CC0-1.0", "MIT"]);
    expect(report.permissions[0].id).toBe("asset-textures");
  });

  it("evaluates the supported dependency version range subset deterministically", () => {
    expect(satisfiesVfxPackageVersion("1.5.0", "^1.2.0")).toBe(true);
    expect(satisfiesVfxPackageVersion("2.0.0", "^1.2.0")).toBe(false);
    expect(satisfiesVfxPackageVersion("1.2.8", "~1.2.0")).toBe(true);
    expect(satisfiesVfxPackageVersion("1.3.0", "~1.2.0")).toBe(false);
    expect(satisfiesVfxPackageVersion("1.2.0", ">=1.2.0")).toBe(true);
    expect(satisfiesVfxPackageVersion("1.1.9", ">=1.2.0")).toBe(false);
    expect(satisfiesVfxPackageVersion("0.2.9", "^0.2.0")).toBe(true);
    expect(satisfiesVfxPackageVersion("0.3.0", "^0.2.0")).toBe(false);
    expect(compareVfxPackageVersions("1.0.0", "1.0.0-beta.2")).toBeGreaterThan(0);
    expect(compareVfxPackageVersions("1.0.0-beta.10", "1.0.0-beta.2")).toBeGreaterThan(0);
  });
});
