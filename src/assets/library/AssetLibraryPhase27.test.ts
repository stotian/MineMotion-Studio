import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { collectProjectAssets } from "./AssetLibrary";
import { applyRelink, findRelinkMatches } from "./AssetRelinker";
import { groupDuplicateAssets } from "./AssetHash";
import { previewUnusedAssetCleanup } from "./AssetCleanup";
import { inspectAssetDependencies } from "./AssetDependencyInspector";
import { validateAssetImportBatch } from "./AssetImportPolicy";
import { normalizeAssetLibrary } from "./AssetCatalog";

function projectWithAssets() {
  const project = createInitialProject();
  project.assets.obj.push({ id: "obj-unused", name: "prop.obj", rawObj: "v 0 0 0", importedAt: "2026-01-01T00:00:00.000Z" });
  project.assets.obj.push({ id: "obj-used", name: "hero.obj", rawObj: "v 0 0 0", importedAt: "2026-01-01T00:00:00.000Z" });
  project.scene.importedObjects.push({
    id: "entity-hero", type: "obj", name: "Hero prop", visible: true, locked: false,
    metadata: {}, transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, assetId: "obj-used"
  });
  return project;
}

describe("phase 27 asset pipeline", () => {
  it("migrates legacy libraries to the versioned identity model", () => {
    const library = normalizeAssetLibrary({ records: [{
      id: "legacy", name: "legacy.obj", type: "objModel", sourcePath: "legacy.obj",
      packagePath: "assets/legacy.obj", sizeBytes: 4, mimeType: "model/obj",
      importedAt: "2026-01-01T00:00:00.000Z", hash: "abcd", missing: false
    }], warnings: [] });
    expect(library.schemaVersion).toBe(2);
    expect(library.records[0]).toMatchObject({ storagePolicy: "embedded", integrity: { status: "verified" } });
  });

  it("preserves references and only proposes unused assets for cleanup", () => {
    const library = collectProjectAssets(projectWithAssets());
    const cleanup = previewUnusedAssetCleanup(library);
    expect(cleanup.removable.map((asset) => asset.id)).toContain("obj-unused");
    expect(cleanup.protected.map((asset) => asset.id)).toContain("obj-used");
  });

  it("finds exact relinks and records mismatched integrity", () => {
    const record = collectProjectAssets(projectWithAssets()).records.find((asset) => asset.id === "obj-used")!;
    const matches = findRelinkMatches(record, [{ name: record.name, displayPath: "/moved/hero.obj", sizeBytes: record.sizeBytes, hash: record.hash }]);
    expect(matches[0].confidence).toBe("exact-hash");
    const relinked = applyRelink({ schemaVersion: 2, records: [record], warnings: [], recentAssetIds: [], cleanupHistory: [] }, record.id, matches[0].candidate);
    expect(relinked.records[0].integrity.status).toBe("verified");
  });

  it("bounds import batches and reports unsupported files", () => {
    const report = validateAssetImportBatch([{ name: "scene.obj", size: 12 }, { name: "script.exe", size: 12 }]);
    expect(report.accepted).toHaveLength(1);
    expect(report.rejected[0].status).toBe("unsupported");
  });

  it("reports package dependencies and duplicate hashes", () => {
    const library = collectProjectAssets(projectWithAssets());
    expect(groupDuplicateAssets(library.records).length).toBeGreaterThanOrEqual(1);
    const report = inspectAssetDependencies(library);
    expect(report.nodes.find((node) => node.asset.id === "obj-used")?.dependencyCount).toBe(1);
  });
});
