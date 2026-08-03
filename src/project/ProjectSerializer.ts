import { sanitizeAudioClips, sanitizeProjectAudio } from "../audio/AudioSerializer";
import { createAudioTimelineItems } from "../audio/AudioTrack";
import { sanitizeAssetLibrary } from "../assets/library/AssetSerializer";
import { createEffectTimelineLaneItems } from "../effects/EffectTimelineTrack";
import { withExportSettingsDefaults } from "../export/ExportSettings";
import { withFfmpegSettingsDefaults } from "../export/ffmpeg/FfmpegSettings";
import { sanitizeRenderQueue } from "../export/renderQueue/RenderQueueStore";
import {
  withPostProcessingDefaults
} from "../rendering/postprocessing/PostProcessingPresets";
import { withLightingDefaults } from "../lighting/LightingSerializer";
import { withBiomeTintDefaults } from "../minecraft/resources/BiomeTint";
import { withWaterRenderDefaults } from "../minecraft/resources/WaterRenderSettings";
import { withMinecraftMaterialDefaults } from "../minecraft/materials/MinecraftMaterialPresets";
import { sanitizeResourcePackAssets } from "../minecraft/resources/ResourcePackScanner";
import { sanitizeWorldImportProfiles } from "../minecraft/import/WorldImportProfiles";
import {
  READ_ONLY_WORLD_SOURCE_POLICY,
  withWorldSceneOverridesDefaults
} from "../minecraft/staging/WorldSceneOverrides";
import { ensureKeyframeMetadata } from "../animation/editor/KeyframeModel";
import { parseMarkers } from "../animation/editor/Markers";
import { parseAnimationClip } from "../animation/editor/ClipSystem";
import {
  ANIMATION_LAYER_KINDS,
  createAnimationLayer
} from "../animation/layers/AnimationLayer";
import type { AnimationLayerKind } from "../animation/layers/AnimationLayerTypes";
import {
  getRigTimelineItems,
  sanitizeCharacterRig,
  sanitizeRigProjectData
} from "../rigs/RigSerializer";
import { reconcileRigAnimation } from "../rigs/RigContract";
import {
  reconcileBlockbenchModelAssets
} from "../rigs/blockbench/BlockbenchAssetContract";
import type {
  MineMotionProject,
  TimelineItem,
  TimelineTrackLane
} from "./ProjectFile";
import {
  createDefaultProjectSettings,
  createDefaultRenderSettings,
  createDefaultTimelineTracks
} from "./ProjectStore";
import { CURRENT_PROJECT_SCHEMA_VERSION } from "../core/serialization/SchemaVersion";
import {
  mergeCanonicalTimelineTracks,
  sanitizeTimelineTracks
} from "./TimelineTrackSanitizer";
import { sanitizeProductionData } from "../production/ShotManager";
import { sanitizeSimulationProject } from "../simulation/SimulationSerializer";
import { sanitizeUltraProjectData } from "../ultra/UltraSerializer";
import { sanitizeMinecraftCreationSuite } from "../minecraft/studio/MinecraftStudioDefaults";
import {
  migrateLegacyEffectsToSchema10,
  normalizeEffectsForSchema10,
  sanitizeSchema10Effects,
  serializeEffectsAsSchema9
} from "../vfx/serialization/VfxProjectMigration";

type UnknownProject = Omit<Partial<MineMotionProject>, "schemaVersion"> & {
  schemaVersion?: number;
  [key: string]: unknown;
};

export class ProjectSerializer {
  static serialize(project: MineMotionProject): string {
    const normalized = ProjectSerializer.toSerializableProject(project);
    const updatedProject: MineMotionProject = {
      ...normalized,
      metadata: {
        ...normalized.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return JSON.stringify(updatedProject, null, 2);
  }

  static serializeLegacyV9(project: MineMotionProject): string {
    const normalized = ProjectSerializer.toSerializableProject(project);
    return JSON.stringify(
      {
        ...normalized,
        schemaVersion: 9,
        effects: {
          instances: serializeEffectsAsSchema9(normalized.effects.instances)
        }
      },
      null,
      2
    );
  }

  static toSerializableProject(project: MineMotionProject): MineMotionProject {
    const sanitizedCharacters = project.scene.characters.map(sanitizeCharacterRig);
    const sanitizedRigs = sanitizeRigProjectData(project.rigs);
    const blockbenchModels = reconcileBlockbenchModelAssets(
      project.assets.blockbench,
      sanitizedRigs.blockbenchModels
    );
    const reconciledRigAnimation = reconcileRigAnimation(
      sanitizedCharacters,
      project.animation.tracks,
      project.animation.durationFrames
    );
    const normalizedTracks = ensureKeyframeMetadata(reconciledRigAnimation.tracks);
    const normalizedBase: MineMotionProject = {
      ...project,
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      scene: {
        ...project.scene,
        characters: reconciledRigAnimation.characters
      },
      assets: {
        ...project.assets,
        blockbench: blockbenchModels
      },
      rigs: {
        ...sanitizedRigs,
        blockbenchModels
      },
      animation: {
        ...project.animation,
        tracks: normalizedTracks
      },
      effects: {
        instances: normalizeEffectsForSchema10(project.effects.instances)
      },
      ultra: sanitizeUltraProjectData(project.ultra)
    };
    const rigItems = getRigTimelineItems(normalizedBase);
    const normalized: MineMotionProject = {
      ...normalizedBase,
      animation: {
        ...normalizedBase.animation,
        timelineTracks: normalizedBase.animation.timelineTracks.map((lane) =>
          lane.id === "track_rig_main"
            ? { ...lane, type: "rig", items: rigItems }
            : lane
        )
      }
    };
    ProjectSerializer.assertValidProject(normalized);
    return normalized;
  }

  static parse(raw: string): MineMotionProject {
    const parsed = JSON.parse(raw) as UnknownProject;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Project file is not a JSON object.");
    }

    if (parsed.schemaVersion !== CURRENT_PROJECT_SCHEMA_VERSION) {
      return ProjectSerializer.migrate(parsed);
    }

    const project = ProjectSerializer.withV10Defaults(parsed, "require");
    ProjectSerializer.assertValidProject(project);
    return project;
  }

  private static migrate(parsed: UnknownProject): MineMotionProject {
    if (parsed.schemaVersion === 1) {
      ProjectSerializer.assertLegacyCoreData(parsed);
      const migratedV2 = ProjectSerializer.withV2CompatibilityDefaults(parsed);
      const migratedV10 = ProjectSerializer.withV10Defaults(migratedV2, "migrate");
      ProjectSerializer.assertValidProject(migratedV10);
      return migratedV10;
    }

    if (
      parsed.schemaVersion === 2 ||
      parsed.schemaVersion === 3 ||
      parsed.schemaVersion === 4 ||
      parsed.schemaVersion === 5 ||
      parsed.schemaVersion === 6 ||
      parsed.schemaVersion === 7 ||
      parsed.schemaVersion === 8 ||
      parsed.schemaVersion === 9
    ) {
      const migratedV10 = ProjectSerializer.withV10Defaults(parsed, "migrate");
      ProjectSerializer.assertValidProject(migratedV10);
      return migratedV10;
    }

    if (parsed.schemaVersion === undefined) {
      throw new Error("Unsupported project file: missing schemaVersion.");
    }

    throw new Error(
      `Unsupported project schema version: ${String(parsed.schemaVersion)}.`
    );
  }

  private static withV2CompatibilityDefaults(
    project: UnknownProject
  ): UnknownProject {
    const settings = createDefaultProjectSettings();
    return {
      ...project,
      schemaVersion: 2,
      projectSettings: {
        ...settings,
        projectName: project.projectName ?? settings.projectName,
        fps: project.animation?.fps ?? settings.fps,
        durationFrames:
          project.animation?.durationFrames ?? settings.durationFrames,
        defaultSkyPreset: project.sky?.preset ?? settings.defaultSkyPreset,
        worldSourcePath: project.world?.sourcePath ?? ""
      }
    };
  }

  private static withV10Defaults(
    project: UnknownProject,
    nativeMode: "migrate" | "require"
  ): MineMotionProject {
    const settingsDefaults = createDefaultProjectSettings();
    const rawEffects = project.effects?.instances;
    const effects =
      nativeMode === "require"
        ? sanitizeSchema10Effects(rawEffects)
        : migrateLegacyEffectsToSchema10(rawEffects);
    const audioClips = sanitizeAudioClips(project.audio?.clips);
    const rigs = sanitizeRigProjectData(project.rigs);
    const blockbenchModels = reconcileBlockbenchModelAssets(
      project.assets?.blockbench,
      rigs.blockbenchModels
    );
    const resourcePacks = sanitizeResourcePackAssets(project.assets?.resourcePacks);
    const lighting = withLightingDefaults(project.lighting);
    const timelineTracks = sanitizeTimelineTracks(
      project.animation?.timelineTracks
    );
    const initialCharacters = (project.scene?.characters ?? []).map((entity) =>
      sanitizeCharacterRig({
        ...entity,
        locked: entity.locked ?? false,
        metadata: entity.metadata ?? {}
      })
    );
    const activeCameraId =
      project.activeCameraId ?? project.scene?.cameras?.[0]?.id ?? "";
    const projectSettings = {
      ...settingsDefaults,
      ...project.projectSettings,
      projectName:
        project.projectSettings?.projectName ??
        project.projectName ??
        settingsDefaults.projectName,
      fps:
        project.projectSettings?.fps ??
        project.animation?.fps ??
        settingsDefaults.fps,
      durationFrames:
        project.projectSettings?.durationFrames ??
        project.animation?.durationFrames ??
        settingsDefaults.durationFrames
    };
    const reconciledRigAnimation = reconcileRigAnimation(
      initialCharacters,
      project.animation?.tracks ?? [],
      projectSettings.durationFrames
    );
    const characters = reconciledRigAnimation.characters;

    return {
      ...(project as MineMotionProject),
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectName: projectSettings.projectName,
      projectSettings,
      packageMetadata: {
        preferredFormat: ".minemotion",
        lastPackageId: project.packageMetadata?.lastPackageId ?? "",
        lastPackagedAt: project.packageMetadata?.lastPackagedAt ?? "",
        warnings: Array.isArray(project.packageMetadata?.warnings)
          ? project.packageMetadata.warnings
          : []
      },
      activeCameraId,
      sky: {
        preset: project.sky?.preset ?? projectSettings.defaultSkyPreset,
        customColor: project.sky?.customColor ?? "#87bfff"
      },
      world: ProjectSerializer.withWorldDefaults(project.world),
      scene: {
        characters,
        cameras: (project.scene?.cameras ?? []).map((entity, index) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {},
          focalLength: entity.focalLength ?? 35,
          near: entity.near ?? 0.1,
          far: entity.far ?? 1000,
          active:
            entity.active ??
            (activeCameraId === ""
              ? index === 0
              : entity.id === activeCameraId)
        })),
        importedObjects: (project.scene?.importedObjects ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        lights: (project.scene?.lights ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        }))
      },
      assets: {
        obj: project.assets?.obj ?? [],
        skins: project.assets?.skins ?? [],
        blockbench: blockbenchModels,
        resourcePacks
      },
      minecraftResources: {
        activeResourcePackId: resourcePacks.some(
          (pack) => pack.id === project.minecraftResources?.activeResourcePackId
        )
          ? project.minecraftResources?.activeResourcePackId ?? null
          : resourcePacks[0]?.id ?? null,
        textureFiltering:
          project.minecraftResources?.textureFiltering === "linear"
            ? "linear"
            : "nearest",
        biomeTint: withBiomeTintDefaults(project.minecraftResources?.biomeTint),
        materials: withMinecraftMaterialDefaults(project.minecraftResources?.materials),
        water: withWaterRenderDefaults(project.minecraftResources?.water)
      },
      lighting,
      rigs: {
        ...rigs,
        blockbenchModels
      },
      assetLibrary: sanitizeAssetLibrary(project.assetLibrary),
      effects: {
        instances: effects
      },
      audio: sanitizeProjectAudio({ ...project.audio, clips: audioClips }),
      postProcessing: withPostProcessingDefaults(project.postProcessing),
      renderSettings: {
        ...createDefaultRenderSettings(),
        ...project.renderSettings
      },
      exportSettings: withExportSettingsDefaults(project.exportSettings),
      ffmpegSettings: withFfmpegSettingsDefaults(project.ffmpegSettings),
      renderQueue: sanitizeRenderQueue(project.renderQueue),
      production: sanitizeProductionData(project.production, {
        ...(project as MineMotionProject),
        production: project.production as MineMotionProject["production"]
      } as MineMotionProject),
      simulations: sanitizeSimulationProject(project.simulations),
      ultra: sanitizeUltraProjectData(project.ultra),
      creationSuite: sanitizeMinecraftCreationSuite(project.creationSuite),
      performanceSettings: {
        showDiagnostics: project.performanceSettings?.showDiagnostics ?? true,
        targetFps: project.performanceSettings?.targetFps ?? 60,
        renderQualityDuringPlayback:
          project.performanceSettings?.renderQualityDuringPlayback ??
          "balanced",
        cacheStaticTerrain:
          project.performanceSettings?.cacheStaticTerrain ?? true
      },
      animation: {
        fps: projectSettings.fps,
        durationFrames: projectSettings.durationFrames,
        currentFrame: project.animation?.currentFrame ?? 0,
        isPlaying: project.animation?.isPlaying ?? false,
        tracks: ensureKeyframeMetadata(reconciledRigAnimation.tracks),
        timelineTracks: ProjectSerializer.withTimelineDefaults(
          {
            ...(project as MineMotionProject),
            animation: {
              ...(project.animation as MineMotionProject["animation"]),
              tracks: project.animation?.tracks ?? []
            },
            scene: {
              ...(project.scene as MineMotionProject["scene"]),
              characters
            },
            rigs,
            lighting
          },
          timelineTracks,
          effects,
          audioClips
        ),
        markers: parseMarkers(JSON.stringify(project.animation?.markers ?? [])),
        clips: ProjectSerializer.withClipDefaults(project.animation?.clips),
        nlaTracks: ProjectSerializer.withNlaDefaults(project.animation?.nlaTracks)
      },
      metadata: {
        createdAt: project.metadata?.createdAt ?? new Date().toISOString(),
        updatedAt: project.metadata?.updatedAt ?? new Date().toISOString(),
        appVersion: "0.8.2"
      }
    };
  }

  private static withWorldDefaults(
    world: MineMotionProject["world"] | undefined
  ): MineMotionProject["world"] {
    if (!world) return null;
    const importedChunks = Array.isArray(world.importedChunks)
      ? world.importedChunks
      : [];
    const importedBlocks = importedChunks.reduce(
      (sum, chunk) => sum + chunk.blocks.length,
      0
    );
    const regionFiles = world.dimensions.reduce(
      (sum, dimension) => sum + dimension.regionFiles.length,
      0
    );

    return {
      ...world,
      selectedDimension: world.selectedDimension ?? "overworld",
      importedChunkRanges: Array.isArray(world.importedChunkRanges)
        ? world.importedChunkRanges
        : [],
      importProfiles: sanitizeWorldImportProfiles(world.importProfiles),
      importedChunks,
      unknownBlockMappings: world.unknownBlockMappings ?? {},
      unknownBlockCount: world.unknownBlockCount ?? 0,
      performanceEstimate: world.performanceEstimate ?? {
        regionFiles,
        estimatedChunks: world.dimensions.reduce(
          (sum, dimension) =>
            sum + (dimension.estimatedChunks ?? dimension.regionFiles.length * 1024),
          0
        ),
        importedChunks: importedChunks.length,
        importedBlocks,
        visibleBlocks: importedBlocks,
        estimatedMemoryBytes: importedBlocks * 20,
        warnings: world.notes
      },
      cachedMesh: world.cachedMesh ?? {
        embedded: importedChunks.length > 0,
        generatedAt: "",
        chunkCount: importedChunks.length,
        blockCount: importedBlocks
      },
      renderOptions: world.renderOptions ?? {
        showChunkBorders: true,
        showWorldOrigin: true
      },
      sceneOverrides: withWorldSceneOverridesDefaults(world.sceneOverrides),
      sourcePolicy: READ_ONLY_WORLD_SOURCE_POLICY
    };
  }

  private static withTimelineDefaults(
    project: MineMotionProject,
    tracks: TimelineTrackLane[] | undefined,
    effects: MineMotionProject["effects"]["instances"],
    audioClips: MineMotionProject["audio"]["clips"]
  ): TimelineTrackLane[] {
    const defaultTracks = createDefaultTimelineTracks();
    const effectItems: TimelineItem[] = createEffectTimelineLaneItems(effects);
    const audioItems: TimelineItem[] = createAudioTimelineItems(audioClips).map(
      (item) => ({
        id: `item_${item.clipId}`,
        type: "audio",
        label: item.clipId,
        targetId: item.clipId,
        audioClipId: item.clipId,
        startFrame: item.startFrame,
        durationFrames: item.durationFrames
      })
    );
    const rigItems: TimelineItem[] = getRigTimelineItems(project);
    const environmentItems: TimelineItem[] = project.lighting.keyframes.map(
      (keyframe) => ({
        id: `item_${keyframe.id}`,
        type: "sky",
        label: `Environment @ ${keyframe.frame}`,
        targetId: "environment",
        environmentKeyframeId: keyframe.id,
        startFrame: keyframe.frame,
        durationFrames: 1
      })
    );

    const hydratedDefaults = defaultTracks.map((track) => {
      if (track.type === "rig") return { ...track, items: rigItems };
      if (track.type === "effect") return { ...track, items: effectItems };
      if (track.type === "audio") return { ...track, items: audioItems };
      if (track.type === "sky") return { ...track, items: environmentItems };
      return track;
    });

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return hydratedDefaults;
    }

    const canonicalTracks = hydratedDefaults.map((defaultTrack) => {
      const existing = tracks.find((track) => track.id === defaultTrack.id);
      return {
        ...defaultTrack,
        ...(existing ?? {}),
        id: defaultTrack.id,
        type: defaultTrack.type,
        items:
          defaultTrack.type === "effect"
            ? effectItems
            : defaultTrack.type === "rig"
              ? rigItems
            : defaultTrack.type === "audio"
              ? audioItems
            : defaultTrack.type === "sky"
              ? environmentItems
              : (existing?.items ?? [])
      };
    });
    return mergeCanonicalTimelineTracks(tracks, canonicalTracks);
  }

  private static withClipDefaults(
    clips: MineMotionProject["animation"]["clips"] | undefined
  ): MineMotionProject["animation"]["clips"] {
    if (!Array.isArray(clips)) return [];
    return clips.flatMap((clip) => {
      try {
        return [parseAnimationClip(JSON.stringify(clip))];
      } catch {
        return [];
      }
    });
  }

  private static withNlaDefaults(
    tracks: MineMotionProject["animation"]["nlaTracks"] | undefined
  ): MineMotionProject["animation"]["nlaTracks"] {
    if (!Array.isArray(tracks)) return [];
    return tracks.flatMap((track, trackIndex) => {
      if (!track || typeof track !== "object") return [];
      const layerKind = ANIMATION_LAYER_KINDS.includes(
        track.layerKind as AnimationLayerKind
      )
        ? track.layerKind as AnimationLayerKind
        : "base";
      const layerDefaults = createAnimationLayer(
        typeof track.targetId === "string" ? track.targetId : "",
        layerKind
      );
      return [{
        id: typeof track.id === "string" ? track.id : `nla_track_${trackIndex}`,
        name: typeof track.name === "string" ? track.name : "NLA Clips",
        targetId: typeof track.targetId === "string" ? track.targetId : "",
        layerKind,
        blendMode: layerDefaults.blendMode,
        weight: finiteClampedNumber(track.weight, 0, 1, 1),
        muted: track.muted === true,
        vfxEffectIds: layerKind === "vfxSync" && Array.isArray(track.vfxEffectIds)
          ? [...new Set(track.vfxEffectIds.filter((id) =>
              typeof id === "string" &&
              /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id)
            ).slice(0, 64))]
          : [],
        clips: Array.isArray(track.clips)
          ? track.clips.flatMap((clip, clipIndex) => {
              if (!clip || typeof clip !== "object") return [];
              return [{
                id: typeof clip.id === "string" ? clip.id : `nla_clip_${clipIndex}`,
                clipId: typeof clip.clipId === "string" ? clip.clipId : "",
                targetId: typeof clip.targetId === "string" ? clip.targetId : "",
                startFrame: Math.max(0, Math.round(Number(clip.startFrame) || 0)),
                durationFrames: Math.max(1, Math.round(Number(clip.durationFrames) || 1)),
                timeScale: Math.max(0.01, Number(clip.timeScale) || 1),
                weight: finiteClampedNumber(clip.weight, 0, 1, 1),
                muted: clip.muted === true
              }];
            })
          : []
      }];
    });
  }

  private static assertLegacyCoreData(project: UnknownProject): void {
    if (!project.scene || !project.animation || !project.assets) {
      throw new Error("Project file is missing required scene data.");
    }
  }

  private static assertValidProject(
    project: Partial<MineMotionProject>
  ): asserts project is MineMotionProject {
    if (project.schemaVersion !== CURRENT_PROJECT_SCHEMA_VERSION) {
      throw new Error("Project file did not migrate to current schema.");
    }

    if (!project.projectName) {
      throw new Error("Project file is missing projectName.");
    }

    if (!project.projectSettings) {
      throw new Error("Project file is missing projectSettings.");
    }

    if (!project.scene || !project.animation || !project.assets) {
      throw new Error("Project file is missing required scene data.");
    }

    if (!project.effects || !project.audio || !project.postProcessing) {
      throw new Error("Project file is missing Phase 2 cinematic data.");
    }

    if (!project.renderSettings) {
      throw new Error("Project file is missing render settings.");
    }

    if (!project.exportSettings || !project.assetLibrary) {
      throw new Error("Project file is missing Phase 3 export/package data.");
    }

    if (!project.ffmpegSettings || !project.renderQueue) {
      throw new Error("Project file is missing Phase 7 production export data.");
    }

    if (!project.minecraftResources || !project.lighting) {
      throw new Error("Project file is missing Phase 8 environment data.");
    }

    if (!project.ultra) {
      throw new Error("Project file is missing Ultra production data.");
    }

    if (!project.creationSuite) {
      throw new Error("Project file is missing Minecraft creation suite data.");
    }

    if (!Array.isArray(project.animation.tracks)) {
      throw new Error("Project file animation.tracks must be an array.");
    }

    if (!Array.isArray(project.animation.timelineTracks)) {
      throw new Error("Project file animation.timelineTracks must be an array.");
    }
  }
}

function finiteClampedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric)
    ? Math.min(maximum, Math.max(minimum, numeric))
    : fallback;
}
