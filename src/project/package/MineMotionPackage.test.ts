import { describe, expect, it } from "vitest";
import { createInitialProject } from "../ProjectStore";
import { ProjectSerializer } from "../ProjectSerializer";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { createMineMotionPackageData } from "./MineMotionPackage";
import { PackageReader } from "./PackageReader";
import { validatePackageData } from "./PackageValidator";

describe("MineMotion package", () => {
  it("creates a valid .minemotion package payload", () => {
    const project = createInitialProject();
    const data = createMineMotionPackageData(project);
    const validation = validatePackageData(data);

    expect(data.packageFormat).toBe("minemotion-package-json");
    expect(data.project.schemaVersion).toBe(10);
    expect(data.manifest.formatName).toBe("MineMotion Studio Package");
    expect(validation.valid).toBe(true);
  });

  it("round-trips schema 10 native VFX through the package reader", () => {
    const data = createMineMotionPackageData({
      ...createInitialProject(),
      effects: {
        instances: [
          {
            ...createEffectInstance("shockwave", {
              id: "effect_package_native",
              startFrame: 14
            }),
            durationFrames: 22
          }
        ]
      }
    });
    const loaded = PackageReader.parse(JSON.stringify(data));

    expect(data.manifest.compatibility.projectSchemaVersion).toBe(10);
    expect(loaded.effects.instances[0].nativeVfx).toMatchObject({
      id: "effect_package_native",
      definitionId: "shockwave",
      startFrame: 14,
      durationFrames: 22,
      parameterKeyframes: []
    });
  });


  it("stores embedded world chunks once and restores them from the portable cache", () => {
    const chunk = {
      id: "overworld:0,0",
      dimension: "overworld" as const,
      regionX: 0,
      regionZ: 0,
      chunkX: 0,
      chunkZ: 0,
      minY: -64,
      maxY: 319,
      sectionsRead: 1,
      blocks: [
        {
          id: "stone" as const,
          minecraftName: "minecraft:stone",
          x: 0,
          y: 64,
          z: 0
        }
      ],
      unknownBlocks: {},
      warnings: [],
      contentFingerprint: "chunk-0"
    };
    const project = createInitialProject();
    project.world = {
      sourceName: "Acceptance World",
      levelDatFound: true,
      dimensions: [{
        id: "overworld",
        label: "Overworld",
        regionFiles: ["region/r.0.0.mca"],
        estimatedChunks: 1
      }],
      selectedDimension: "overworld",
      importedChunks: [chunk],
      cachedMesh: {
        embedded: true,
        generatedAt: "2026-07-29T00:00:00.000Z",
        chunkCount: 1,
        blockCount: 1
      },
      importedAt: "2026-07-29T00:00:00.000Z",
      notes: []
    };

    const data = createMineMotionPackageData(project);
    const cachePath = data.project.world?.cachedMesh?.cacheAssetPath;

    expect(data.project.world?.importedChunks).toEqual([]);
    expect(cachePath).toBeTruthy();
    expect(Object.keys(data.assets.worldCaches ?? {})).toEqual([cachePath]);

    const loaded = PackageReader.parse(JSON.stringify(data));
    expect(loaded.world?.importedChunks).toEqual([chunk]);
    expect(loaded.world?.cachedMesh).toMatchObject({
      embedded: true,
      chunkCount: 1,
      blockCount: 1
    });
  });

  it("keeps runtime chunks visible but omits them from a reference-only package", () => {
    const project = createInitialProject();
    project.world = {
      sourceName: "Reference World",
      sourcePath: "Reference World",
      levelDatFound: true,
      dimensions: [{ id: "overworld", label: "Overworld", regionFiles: ["region/r.0.0.mca"] }],
      selectedDimension: "overworld",
      importedChunks: [{
        id: "overworld:0,0",
        dimension: "overworld",
        regionX: 0,
        regionZ: 0,
        chunkX: 0,
        chunkZ: 0,
        minY: -64,
        maxY: 319,
        sectionsRead: 1,
        blocks: [{ id: "stone", minecraftName: "minecraft:stone", x: 0, y: 64, z: 0 }],
        unknownBlocks: {},
        warnings: []
      }],
      cachedMesh: {
        embedded: false,
        generatedAt: "2026-07-29T00:00:00.000Z",
        chunkCount: 1,
        blockCount: 1
      },
      importedAt: "2026-07-29T00:00:00.000Z",
      notes: []
    };

    expect(project.world.importedChunks).toHaveLength(1);
    const data = createMineMotionPackageData(project);
    expect(data.project.world?.importedChunks).toEqual([]);
    expect(data.assets.worldCaches).toEqual({});
    expect(data.project.world?.notes.join(" ")).toMatch(/not embedded/i);
  });

  it("keeps a package recoverable when its portable world cache is missing", () => {
    const project = createInitialProject();
    project.world = {
      sourceName: "Missing Cache World",
      levelDatFound: false,
      dimensions: [],
      importedChunks: [],
      cachedMesh: {
        embedded: true,
        generatedAt: "2026-07-29T00:00:00.000Z",
        chunkCount: 1,
        blockCount: 1,
        cacheAssetPath: "world/cache/missing.json"
      },
      importedAt: "2026-07-29T00:00:00.000Z",
      notes: []
    };
    const data = createMineMotionPackageData(project);

    expect(validatePackageData(data).warnings).toContain(
      "Portable world cache asset is missing: world/cache/missing.json."
    );
    const loaded = PackageReader.parse(JSON.stringify(data));
    expect(loaded.world?.notes.join(" ")).toMatch(/cache is missing/i);
  });

  it("rejects package/project schema mismatches and future package versions", () => {
    const data = createMineMotionPackageData(createInitialProject());
    const mismatch = structuredClone(data);
    mismatch.manifest.compatibility.projectSchemaVersion = 9;
    expect(validatePackageData(mismatch).errors).toContain(
      "Package manifest project schema does not match project data."
    );

    const future = structuredClone(data) as unknown as {
      manifest: { schemaVersion: number };
    };
    future.manifest.schemaVersion = 2;
    expect(validatePackageData(future as never).valid).toBe(false);
  });

  it("loads a schema 9 project from an existing package v1 payload", () => {
    const current = {
      ...createInitialProject(),
      effects: {
        instances: [
          createEffectInstance("flash", {
            id: "effect_legacy_package",
            startFrame: 9
          })
        ]
      }
    };
    const data = createMineMotionPackageData(current);
    const legacyProject = JSON.parse(ProjectSerializer.serializeLegacyV9(current));
    const legacyPackage = {
      ...data,
      project: legacyProject,
      manifest: {
        ...data.manifest,
        compatibility: {
          ...data.manifest.compatibility,
          projectSchemaVersion: 9
        }
      }
    };

    const loaded = PackageReader.parse(JSON.stringify(legacyPackage));
    expect(loaded.schemaVersion).toBe(10);
    expect(loaded.effects.instances[0].nativeVfx).toMatchObject({
      id: "effect_legacy_package",
      definitionId: "flash"
    });
  });
});
