import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../../project/ProjectAutosave";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { BlockbenchImporter } from "./BlockbenchImporter";
import {
  reconcileBlockbenchModelAssets,
  sanitizeBlockbenchModelAssets
} from "./BlockbenchAssetContract";

const RAW_MODEL = JSON.stringify({
  name: "Animated Tool",
  meta: {
    format_version: "4.12",
    model_format: "free"
  },
  elements: [{
    uuid: "cube",
    name: "cube",
    from: [0, 0, 0],
    to: [4, 12, 4],
    origin: [2, 6, 2],
    rotation: [0, 0, 15],
    faces: {}
  }],
  outliner: [{
    name: "root",
    children: ["cube"]
  }],
  textures: [{ name: "tool.png", source: "data:image/png;base64,AA==" }],
  animations: [{ name: "swing", length: 0.5, snapping: 20, animators: {} }]
});

describe("BlockbenchAssetContract", () => {
  it("creates deterministic rich import metadata from current .bbmodel structure", async () => {
    const file = new File([RAW_MODEL], "tool.bbmodel", {
      type: "application/json"
    });
    const first = await BlockbenchImporter.fromFile(file);
    const second = await BlockbenchImporter.fromFile(file);

    expect(first.asset.id).toBe(second.asset.id);
    expect(first.asset).toMatchObject({
      name: "Animated Tool",
      modelFormat: "free",
      elementCount: 1,
      groupCount: 1,
      textureCount: 1,
      animationCount: 1,
      animationNames: ["swing"]
    });
    expect(first.asset.unsupportedFeatures).toEqual([
      "texture-material-preview",
      "animation-mapping-required"
    ]);
    expect(first.rawObj).toContain("g root_cube");
  });

  it("recomputes reports, rejects corrupt payloads, and gives primary assets precedence", () => {
    const stale = {
      id: "bbmodel_stale",
      name: "Stale",
      formatVersion: "old",
      elementCount: 999,
      groupCount: 999,
      textureCount: 999,
      importedAt: "invalid",
      warnings: [],
      rawJson: RAW_MODEL
    };
    const sanitized = sanitizeBlockbenchModelAssets([
      stale,
      { ...stale, id: "bad", rawJson: "not json" }
    ]);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0]).toMatchObject({
      id: "bbmodel_stale",
      elementCount: 1,
      groupCount: 1,
      textureCount: 1,
      animationCount: 1,
      importedAt: "1970-01-01T00:00:00.000Z"
    });

    const compatibility = {
      ...stale,
      name: "Compatibility copy",
      rawJson: JSON.stringify({ name: "Different", elements: [] })
    };
    expect(reconcileBlockbenchModelAssets(
      [stale],
      [compatibility]
    )[0].name).toBe("Stale");
  });

  it("reconciles the asset authority through every project path", async () => {
    const imported = await BlockbenchImporter.fromFile(
      new File([RAW_MODEL], "tool.bbmodel")
    );
    const project = createInitialProject();
    project.assets.blockbench = [];
    project.rigs.blockbenchModels = [imported.asset];

    const serialized = ProjectSerializer.parse(
      ProjectSerializer.serialize(project)
    );
    expect(serialized.assets.blockbench).toEqual(
      serialized.rigs.blockbenchModels
    );
    expect(serialized.assets.blockbench[0].animationNames).toEqual(["swing"]);

    const packagedData = createMineMotionPackageData(project);
    expect(Object.keys(packagedData.assets.blockbench)).toEqual([
      `assets/blockbench/${imported.asset.id}.bbmodel.json`
    ]);
    const packaged = PackageReader.parse(JSON.stringify(packagedData));
    const schema9 = ProjectSerializer.parse(
      ProjectSerializer.serializeLegacyV9(project)
    );
    for (const candidate of [packaged, schema9]) {
      expect(candidate.assets.blockbench).toEqual(
        candidate.rigs.blockbenchModels
      );
      expect(candidate.assets.blockbench[0].elementCount).toBe(1);
    }

    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, project);
    expect(loadProjectAutosave(storage)?.project.assets.blockbench[0]
      .animationCount).toBe(1);

    const history = new HistoryStack<typeof project>();
    history.push(project, "Before Blockbench");
    expect(history.undo(serialized)?.rigs.blockbenchModels[0].id)
      .toBe(imported.asset.id);
  });
});
