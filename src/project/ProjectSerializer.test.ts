import { describe, expect, it } from "vitest";
import { createInitialProject } from "./ProjectStore";
import { ProjectSerializer } from "./ProjectSerializer";

describe("ProjectSerializer", () => {
  it("round-trips a schema v6 project", () => {
    const project = createInitialProject();
    const raw = ProjectSerializer.serialize(project);
    const parsed = ProjectSerializer.parse(raw);

    expect(parsed.schemaVersion).toBe(6);
    expect(parsed.projectSettings.schemaVersion).toBe(1);
    expect(parsed.postProcessing.presetId).toBe("clean-preview");
    expect(parsed.renderSettings.resolutionPreset).toBe("1080p");
    expect(parsed.effects.instances).toEqual([]);
    expect(parsed.audio.clips).toEqual([]);
    expect(parsed.exportSettings.width).toBe(1920);
    expect(parsed.assetLibrary.records).toEqual([]);
    expect(parsed.performanceSettings.cacheStaticTerrain).toBe(true);
    expect(parsed.rigs.savedPoses).toEqual([]);
    expect(parsed.assets.skins).toEqual([]);
    expect(parsed.scene.characters[0].rigPreset).toBe("steve");
    expect(parsed.projectName).toBe(project.projectName);
    expect(parsed.scene.characters).toHaveLength(1);
    expect(parsed.animation.fps).toBe(24);
  });

  it("migrates a schema v1 project with fallback project settings", () => {
    const project = createInitialProject();
    const legacy = {
      ...project,
      schemaVersion: 1,
      projectSettings: undefined,
      scene: {
        characters: project.scene.characters.map(({ locked: _locked, metadata: _metadata, ...entity }) => entity),
        cameras: project.scene.cameras.map(({ locked: _locked, metadata: _metadata, ...entity }) => entity),
        importedObjects: [],
        lights: project.scene.lights.map(({ locked: _locked, metadata: _metadata, ...entity }) => entity)
      }
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacy));

    expect(parsed.schemaVersion).toBe(6);
    expect(parsed.projectSettings.projectName).toBe(project.projectName);
    expect(parsed.projectSettings.fps).toBe(project.animation.fps);
    expect(parsed.renderSettings.renderPreviewEnabled).toBe(false);
    expect(parsed.exportSettings.outputName).toBe("render");
    expect(parsed.assetLibrary.warnings).toEqual([]);
    expect(parsed.animation.timelineTracks.map((track) => track.type)).toContain("effect");
    expect(parsed.animation.timelineTracks.map((track) => track.type)).toContain("rig");
    expect(parsed.scene.characters[0].locked).toBe(false);
    expect(parsed.scene.characters[0].metadata).toEqual({});
  });

  it("migrates a schema v2 project with Phase 2, 3, 4 and 5 defaults", () => {
    const project = createInitialProject();
    const legacyV2 = {
      ...project,
      schemaVersion: 2,
      activeCameraId: undefined,
      effects: undefined,
      audio: undefined,
      postProcessing: undefined,
      renderSettings: undefined,
      animation: {
        ...project.animation,
        timelineTracks: undefined
      }
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacyV2));

    expect(parsed.schemaVersion).toBe(6);
    expect(parsed.activeCameraId).toBe(parsed.scene.cameras[0].id);
    expect(parsed.scene.cameras[0].active).toBe(true);
    expect(parsed.postProcessing.enabled).toBe(true);
    expect(parsed.exportSettings.fps).toBe(project.animation.fps);
    expect(parsed.packageMetadata.preferredFormat).toBe(".minemotion");
    expect(parsed.animation.timelineTracks).toHaveLength(5);
    expect(parsed.assets.blockbench).toEqual([]);
  });

  it("migrates schema v4 world scan metadata to schema v6 defaults", () => {
    const project = createInitialProject();
    const legacyV4 = {
      ...project,
      schemaVersion: 4,
      world: {
        sourceName: "TinyWorld",
        levelDatFound: true,
        dimensions: [
          {
            id: "overworld",
            label: "Overworld",
            regionFiles: ["region/r.0.0.mca"]
          }
        ],
        importedAt: new Date(0).toISOString(),
        notes: []
      }
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacyV4));

    expect(parsed.schemaVersion).toBe(6);
    expect(parsed.world?.selectedDimension).toBe("overworld");
    expect(parsed.world?.importedChunks).toEqual([]);
    expect(parsed.world?.renderOptions?.showChunkBorders).toBe(true);
  });

  it("migrates a schema v5 project to schema v6 rig defaults", () => {
    const project = createInitialProject();
    const legacyV5 = {
      ...project,
      schemaVersion: 5,
      rigs: undefined,
      assets: {
        obj: []
      },
      scene: {
        ...project.scene,
        characters: project.scene.characters.map((character) => ({
          ...character,
          rigPreset: "default_steve",
          skin: undefined,
          attachments: undefined,
          boneKeyframes: undefined
        }))
      }
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacyV5));

    expect(parsed.schemaVersion).toBe(6);
    expect(parsed.scene.characters[0].rigPreset).toBe("steve");
    expect(parsed.scene.characters[0].skin).toBeNull();
    expect(parsed.scene.characters[0].attachments?.length).toBeGreaterThan(0);
    expect(parsed.rigs.blockbenchModels).toEqual([]);
  });

  it("rejects invalid project JSON", () => {
    expect(() =>
      ProjectSerializer.parse(
        JSON.stringify({
            schemaVersion: 1,
            projectName: "Broken"
        })
      )
    ).toThrow(/required scene data/i);
  });
});
