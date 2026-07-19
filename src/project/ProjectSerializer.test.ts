import { describe, expect, it } from "vitest";
import type { EffectInstance } from "../effects/EffectTypes";
import { createInitialProject } from "./ProjectStore";
import { ProjectSerializer } from "./ProjectSerializer";

describe("ProjectSerializer", () => {
  it("round-trips a schema v10 project", () => {
    const project = createInitialProject();
    const raw = ProjectSerializer.serialize(project);
    const parsed = ProjectSerializer.parse(raw);

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.projectSettings.schemaVersion).toBe(1);
    expect(parsed.postProcessing.presetId).toBe("clean-preview");
    expect(parsed.renderSettings.resolutionPreset).toBe("1080p");
    expect(parsed.effects.instances).toEqual([]);
    expect(parsed.audio.clips).toEqual([]);
    expect(parsed.exportSettings.width).toBe(1920);
    expect(parsed.renderQueue.jobs).toEqual([]);
    expect(parsed.ffmpegSettings.executablePath).toBe("ffmpeg");
    expect(parsed.assetLibrary.records).toEqual([]);
    expect(parsed.performanceSettings.cacheStaticTerrain).toBe(true);
    expect(parsed.rigs.savedPoses).toEqual([]);
    expect(parsed.assets.skins).toEqual([]);
    expect(parsed.assets.resourcePacks).toEqual([]);
    expect(parsed.lighting.presetId).toBe("clear-day");
    expect(parsed.scene.characters[0].rigPreset).toBe("steve");
    expect(parsed.projectName).toBe(project.projectName);
    expect(parsed.scene.characters).toHaveLength(1);
    expect(parsed.animation.fps).toBe(24);
  });

  it("round-trips every legacy effect field with synchronized native VFX data", () => {
    const effect: EffectInstance = {
      id: "effect_schema_9",
      type: "shockwave",
      name: "Saved Shockwave",
      startFrame: 18,
      durationFrames: 20,
      position: [1, 2, 3],
      targetObjectId: "character_steve",
      parameters: {
        color: "#abcdef",
        alpha: 0.7,
        radius: 6,
        flash: false
      },
      enabled: true
    };
    const initial = createInitialProject();
    const parsed = ProjectSerializer.parse(
      ProjectSerializer.serialize({
        ...initial,
        effects: { instances: [effect] }
      })
    );

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.effects.instances[0]).toMatchObject(effect);
    expect(parsed.effects.instances[0].nativeVfx).toMatchObject({
      serializationVersion: 1,
      id: effect.id,
      definitionId: effect.type,
      displayName: effect.name,
      startFrame: effect.startFrame,
      durationFrames: effect.durationFrames,
      transform: { position: effect.position },
      target: { entityId: effect.targetObjectId },
      parameters: effect.parameters,
      parameterKeyframes: []
    });
    expect(
      parsed.animation.timelineTracks
        .find((track) => track.id === "track_effects_main")
        ?.items[0]
    ).toMatchObject({
      effectId: effect.id,
      startFrame: effect.startFrame,
      durationFrames: effect.durationFrames
    });
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

    expect(parsed.schemaVersion).toBe(10);
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

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.activeCameraId).toBe(parsed.scene.cameras[0].id);
    expect(parsed.scene.cameras[0].active).toBe(true);
    expect(parsed.postProcessing.enabled).toBe(true);
    expect(parsed.exportSettings.fps).toBe(project.animation.fps);
    expect(parsed.packageMetadata.preferredFormat).toBe(".minemotion");
    expect(parsed.animation.timelineTracks).toHaveLength(6);
    expect(parsed.assets.blockbench).toEqual([]);
  });

  it("migrates a schema v3 cinematic project through package and native VFX defaults", () => {
    const project = createInitialProject();
    const effect: EffectInstance = {
      id: "effect_schema_3",
      type: "impactFrame",
      name: "Schema 3 Impact",
      startFrame: 6,
      durationFrames: 3,
      position: [0, 2, 0],
      targetObjectId: "",
      parameters: { color: "#ffffff", alpha: 0.9 },
      enabled: true
    };
    const parsed = ProjectSerializer.parse(
      JSON.stringify({
        ...project,
        schemaVersion: 3,
        packageMetadata: undefined,
        assetLibrary: undefined,
        exportSettings: undefined,
        performanceSettings: undefined,
        effects: { instances: [effect] }
      })
    );

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.effects.instances[0]).toMatchObject(effect);
    expect(parsed.effects.instances[0].nativeVfx?.definitionId).toBe("impactFrame");
    expect(parsed.packageMetadata.preferredFormat).toBe(".minemotion");
    expect(parsed.assetLibrary.records).toEqual([]);
  });

  it("migrates schema v4 world scan metadata to current defaults", () => {
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

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.world?.selectedDimension).toBe("overworld");
    expect(parsed.world?.importedChunks).toEqual([]);
    expect(parsed.world?.renderOptions?.showChunkBorders).toBe(true);
  });

  it("migrates a schema v5 project with rig defaults", () => {
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

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.scene.characters[0].rigPreset).toBe("steve");
    expect(parsed.scene.characters[0].skin).toBeNull();
    expect(parsed.scene.characters[0].attachments?.length).toBeGreaterThan(0);
    expect(parsed.rigs.blockbenchModels).toEqual([]);
  });

  it("migrates a schema v6 project to Phase 8 environment defaults", () => {
    const project = createInitialProject();
    const legacyV6 = {
      ...project,
      schemaVersion: 6,
      lighting: undefined,
      minecraftResources: undefined,
      assets: {
        obj: project.assets.obj,
        skins: project.assets.skins,
        blockbench: project.assets.blockbench
      }
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacyV6));

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.lighting.presetId).toBe("clear-day");
    expect(parsed.minecraftResources.textureFiltering).toBe("nearest");
    expect(parsed.minecraftResources.activeResourcePackId).toBeNull();
    expect(parsed.assets.resourcePacks).toEqual([]);
  });

  it("migrates a schema v7 project to Phase 6 editor defaults", () => {
    const project = createInitialProject();
    const legacyV7 = {
      ...project,
      schemaVersion: 7,
      animation: {
        ...project.animation,
        markers: undefined,
        clips: undefined,
        nlaTracks: undefined,
        tracks: [{
          id: "camera_main:transform.position",
          targetId: "camera_main",
          property: "transform.position",
          keyframes: [{ frame: 4, value: [1, 2, 3] }]
        }]
      }
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacyV7));

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.animation.markers).toEqual([]);
    expect(parsed.animation.clips).toEqual([]);
    expect(parsed.animation.nlaTracks).toEqual([]);
    expect(parsed.animation.tracks[0].keyframes[0].id).toBeTruthy();
    expect(parsed.animation.tracks[0].keyframes[0].interpolation).toBe("linear");
  });

  it("migrates a schema v8 project to production render defaults", () => {
    const project = createInitialProject();
    const legacyV8 = {
      ...project,
      schemaVersion: 8,
      ffmpegSettings: undefined,
      renderQueue: undefined
    };

    const parsed = ProjectSerializer.parse(JSON.stringify(legacyV8));

    expect(parsed.schemaVersion).toBe(10);
    expect(parsed.ffmpegSettings).toMatchObject({
      executablePath: "ffmpeg",
      outputDirectory: "",
      overwriteExisting: false
    });
    expect(parsed.renderQueue).toEqual({
      jobs: [],
      activeJobId: null,
      historyLimit: 30
    });
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

  it("migrates an explicit schema v9 fixture without changing legacy effect data", () => {
    const project = createInitialProject();
    const effect: EffectInstance = {
      id: "effect_v9_fixture",
      type: "flash",
      name: "Legacy Flash",
      startFrame: 12,
      durationFrames: 8,
      position: [3, 4, 5],
      targetObjectId: "camera_main",
      parameters: { color: "#123456", alpha: 0.4 },
      enabled: false
    };
    const migrated = ProjectSerializer.parse(
      JSON.stringify({
        ...project,
        schemaVersion: 9,
        effects: { instances: [effect] }
      })
    );

    expect(migrated.schemaVersion).toBe(10);
    expect(migrated.effects.instances[0]).toMatchObject(effect);
    expect(migrated.effects.instances[0].nativeVfx).toMatchObject({
      id: effect.id,
      definitionId: effect.type,
      startFrame: effect.startFrame,
      durationFrames: effect.durationFrames,
      enabled: effect.enabled,
      transform: { position: effect.position },
      target: { entityId: effect.targetObjectId },
      parameters: effect.parameters
    });
  });

  it("preserves invalid and special legacy parameters while creating a safe native repair", () => {
    const parameters = Object.fromEntries([
      ["count", 1_000_000_000],
      ["__proto__", "legacy-special"]
    ]);
    const migrated = ProjectSerializer.parse(
      JSON.stringify({
        ...createInitialProject(),
        schemaVersion: 9,
        effects: {
          instances: [
            {
              id: "effect_legacy_repair",
              type: "glowBurst",
              name: "Legacy Repair",
              startFrame: 2,
              durationFrames: 10,
              position: [0, 2, 0],
              targetObjectId: "",
              parameters,
              enabled: true
            }
          ]
        }
      })
    );
    const effect = migrated.effects.instances[0];
    expect(effect.parameters.count).toBe(1_000_000_000);
    expect(Object.hasOwn(effect.parameters, "__proto__")).toBe(true);
    expect(effect.nativeVfx?.parameters.count).toBe(18);
    expect(Object.hasOwn(effect.nativeVfx?.parameters ?? {}, "__proto__")).toBe(true);
  });

  it("round-trips native-only VFX fields and parameter keyframes", () => {
    const base = ProjectSerializer.parse(
      ProjectSerializer.serialize({
        ...createInitialProject(),
        effects: {
          instances: [
            {
              id: "effect_native_roundtrip",
              type: "shockwave",
              name: "Native Shockwave",
              startFrame: 30,
              durationFrames: 24,
              position: [1, 2, 3],
              targetObjectId: "character_steve",
              parameters: { color: "#abcdef", alpha: 0.8, radius: 6 },
              enabled: true
            }
          ]
        }
      })
    );
    const effect = base.effects.instances[0];
    if (!effect?.nativeVfx) throw new Error("native VFX fixture missing");
    effect.nativeVfx = {
      ...effect.nativeVfx,
      transform: {
        ...effect.nativeVfx.transform,
        rotation: [10, 20, 30],
        scale: [2, 2, 2]
      },
      target: { entityId: "character_steve", boneId: "right_hand" },
      seed: "custom-native-seed",
      blendMode: "screen",
      renderLayer: "overlay",
      previewQuality: "draft",
      exportQuality: "final",
      parameterKeyframes: [
        {
          id: "vfx_key_radius_1",
          parameterId: "radius",
          localFrame: 6,
          value: 8,
          interpolation: "ease-in-out"
        }
      ]
    };

    const parsed = ProjectSerializer.parse(ProjectSerializer.serialize(base));
    expect(parsed.effects.instances[0].nativeVfx).toEqual(effect.nativeVfx);
    expect(parsed.effects.instances[0]).toMatchObject({
      id: effect.id,
      startFrame: effect.startFrame,
      durationFrames: effect.durationFrames,
      position: effect.position,
      parameters: effect.parameters
    });
  });

  it("exports a lossless schema v9 rollback and rejects native-only data loss", () => {
    const project = ProjectSerializer.parse(
      ProjectSerializer.serialize({
        ...createInitialProject(),
        effects: {
          instances: [
            {
              id: "effect_schema9_rollback",
              type: "flash",
              name: "Rollback Flash",
              startFrame: 4,
              durationFrames: 6,
              position: [0, 2, 0],
              targetObjectId: "",
              parameters: { color: "#ffffff", alpha: 0.5 },
              enabled: true
            }
          ]
        }
      })
    );

    const rollback = JSON.parse(ProjectSerializer.serializeLegacyV9(project));
    expect(rollback.schemaVersion).toBe(9);
    expect(rollback.effects.instances[0].nativeVfx).toBeUndefined();
    expect(ProjectSerializer.parse(JSON.stringify(rollback)).schemaVersion).toBe(10);

    const native = project.effects.instances[0].nativeVfx;
    if (!native) throw new Error("native VFX fixture missing");
    native.transform.rotation = [0, 45, 0];
    expect(() => ProjectSerializer.serializeLegacyV9(project)).toThrow(
      /cannot be exported to schema 9/i
    );
  });

  it("rejects corrupt and future schema 10 payloads", () => {
    const valid = JSON.parse(ProjectSerializer.serialize({
      ...createInitialProject(),
      effects: {
        instances: [
          {
            id: "effect_corruption",
            type: "flash",
            name: "Corruption Fixture",
            startFrame: 0,
            durationFrames: 4,
            position: [0, 2, 0],
            targetObjectId: "",
            parameters: { color: "#ffffff", alpha: 0.5 },
            enabled: true
          }
        ]
      }
    }));

    const missingNative = structuredClone(valid);
    delete missingNative.effects.instances[0].nativeVfx;
    expect(() => ProjectSerializer.parse(JSON.stringify(missingNative))).toThrow(
      /nativeVfx data is required/i
    );

    const futureNative = structuredClone(valid);
    futureNative.effects.instances[0].nativeVfx.serializationVersion = 2;
    expect(() => ProjectSerializer.parse(JSON.stringify(futureNative))).toThrow(
      /serialization version is unsupported/i
    );

    const inconsistent = structuredClone(valid);
    inconsistent.effects.instances[0].nativeVfx.startFrame = 99;
    expect(() => ProjectSerializer.parse(JSON.stringify(inconsistent))).toThrow(
      /shared fields are inconsistent/i
    );

    expect(() =>
      ProjectSerializer.parse(JSON.stringify({ ...valid, schemaVersion: 11 }))
    ).toThrow(/unsupported project schema version: 11/i);
  });
});
