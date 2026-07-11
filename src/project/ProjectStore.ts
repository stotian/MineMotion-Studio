import type {
  CameraEntity,
  CharacterEntity,
  LightEntity,
  MineMotionProject,
  MutableSceneCollection,
  ObjectLookupResult,
  ObjEntity,
  ProjectSettings,
  RenderSettings,
  TimelineTrackLane,
  TransformData
} from "./ProjectFile";
import { cloneTransform, createTransform } from "./ProjectFile";
import type { AppSettings } from "../settings/AppSettings";
import { DEFAULT_POST_PROCESSING } from "../rendering/postprocessing/PostProcessingPresets";
import { DEFAULT_EXPORT_SETTINGS } from "../export/ExportSettings";
import { DEFAULT_FFMPEG_SETTINGS } from "../export/ffmpeg/FfmpegSettings";
import { DEFAULT_RENDER_QUEUE } from "../export/renderQueue/RenderQueueStore";
import { getDefaultBoneRotations } from "../rigs/RigDefinition";
import { getRigDefinition } from "../rigs/MinecraftRigPresets";
import { createDefaultCharacterAttachments } from "../rigs/RigInstance";
import { DEFAULT_LIGHTING_SETTINGS } from "../lighting/LightingPresets";
import { DEFAULT_BIOME_TINT } from "../minecraft/resources/BiomeTint";
import { DEFAULT_MINECRAFT_MATERIAL_SETTINGS } from "../minecraft/materials/MinecraftMaterialPresets";

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function createDefaultProjectSettings(
  appSettings?: AppSettings
): ProjectSettings {
  return {
    schemaVersion: 1,
    projectName:
      appSettings?.general.defaultProjectNamePattern ??
      "Untitled MineMotion Project",
    fps: appSettings?.general.defaultFps ?? 24,
    durationFrames:
      appSettings?.general.defaultProjectDurationFrames ?? 300,
    defaultSkyPreset: appSettings?.minecraft.defaultSkyPreset ?? "Day",
    worldSourcePath: "",
    renderResolutionPreset: "1080p",
    author: "",
    notes: "",
    terrainPreset: "demo",
    blockPaletteStyle:
      appSettings?.minecraft.defaultBlockPaletteStyle ?? "classic"
  };
}

export function createDefaultRenderSettings(): RenderSettings {
  return {
    resolutionPreset: "1080p",
    customWidth: 1920,
    customHeight: 1080,
    aspectRatio: "16:9",
    renderPreviewEnabled: false,
    cinematicBarsEnabled: false,
    cinematicBarsRatio: "2.35:1"
  };
}

export function createDefaultTimelineTracks(): TimelineTrackLane[] {
  return [
    {
      id: "track_transform_main",
      type: "transform",
      name: "Transform",
      items: []
    },
    {
      id: "track_rig_main",
      type: "rig",
      name: "Rig Bones",
      items: []
    },
    {
      id: "track_effects_main",
      type: "effect",
      name: "Effects",
      items: []
    },
    {
      id: "track_audio_main",
      type: "audio",
      name: "Audio",
      items: []
    },
    {
      id: "track_post_main",
      type: "postProcessing",
      name: "Post",
      items: []
    },
    {
      id: "track_sky_main",
      type: "sky",
      name: "Lighting & Sky",
      items: []
    }
  ];
}

export function createInitialProject(appSettings?: AppSettings): MineMotionProject {
  const now = new Date().toISOString();
  const projectSettings = createDefaultProjectSettings(appSettings);

  const defaultCamera: CameraEntity = {
    id: "camera_main",
    type: "camera",
    name: "Scene Camera",
    visible: true,
    locked: false,
    metadata: {},
    transform: createTransform({
      position: [8, 6, 8],
      rotation: [-30, 45, 0]
    }),
    fov: 45,
    focalLength: 35,
    near: 0.1,
    far: 1000,
    active: true
  };

  const sun: LightEntity = {
    id: "light_key",
    type: "light",
    name: "Key Light",
    visible: true,
    locked: false,
    metadata: {},
    transform: createTransform({
      position: [8, 12, 6]
    }),
    intensity: 1.2,
    color: "#ffffff"
  };

  return {
    schemaVersion: 9,
    projectName: projectSettings.projectName,
    projectSettings,
    packageMetadata: {
      preferredFormat: ".minemotion",
      lastPackageId: "",
      lastPackagedAt: "",
      warnings: []
    },
    activeCameraId: defaultCamera.id,
    sky: {
      preset: projectSettings.defaultSkyPreset,
      customColor: "#87bfff"
    },
    world: null,
    scene: {
      characters: [createCharacter("Steve Rig", [0, 1.05, 0])],
      cameras: [defaultCamera],
      importedObjects: [],
      lights: [sun]
    },
    assets: {
      obj: [],
      skins: [],
      blockbench: [],
      resourcePacks: []
    },
    minecraftResources: {
      activeResourcePackId: null,
      textureFiltering: "nearest",
      biomeTint: { ...DEFAULT_BIOME_TINT },
      materials: {
        ...DEFAULT_MINECRAFT_MATERIAL_SETTINGS,
        overrides: {}
      }
    },
    lighting: {
      ...DEFAULT_LIGHTING_SETTINGS,
      sunDirection: [...DEFAULT_LIGHTING_SETTINGS.sunDirection],
      keyframes: []
    },
    rigs: {
      savedPoses: [],
      animationClips: [],
      blockbenchModels: []
    },
    assetLibrary: {
      records: [],
      warnings: []
    },
    effects: {
      instances: []
    },
    audio: {
      clips: []
    },
    postProcessing: DEFAULT_POST_PROCESSING,
    renderSettings: createDefaultRenderSettings(),
    exportSettings: {
      ...DEFAULT_EXPORT_SETTINGS,
      endFrame: projectSettings.durationFrames,
      fps: projectSettings.fps
    },
    ffmpegSettings: { ...DEFAULT_FFMPEG_SETTINGS },
    renderQueue: {
      ...DEFAULT_RENDER_QUEUE,
      jobs: []
    },
    performanceSettings: {
      showDiagnostics: true,
      targetFps: 60,
      renderQualityDuringPlayback: "balanced",
      cacheStaticTerrain: true
    },
    animation: {
      fps: projectSettings.fps,
      durationFrames: projectSettings.durationFrames,
      currentFrame: 0,
      isPlaying: false,
      tracks: [],
      timelineTracks: createDefaultTimelineTracks(),
      markers: [],
      clips: [],
      nlaTracks: []
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      appVersion: "0.8.2"
    }
  };
}

export function createCharacter(
  name = "Minecraft Character",
  position: [number, number, number] = [0, 1.05, 0]
): CharacterEntity {
  const rigDefinition = getRigDefinition("steve");
  return {
    id: createId("character"),
    type: "character",
    name,
    visible: true,
    locked: false,
    metadata: {},
    transform: createTransform({ position }),
    rigPreset: "steve",
    modelType: "steve",
    selectedBoneId: "body",
    boneRotations: getDefaultBoneRotations(rigDefinition),
    skin: null,
    attachments: createDefaultCharacterAttachments(),
    boneKeyframes: []
  };
}

export function createSceneCamera(name = "Camera"): CameraEntity {
  return {
    id: createId("camera"),
    type: "camera",
    name,
    visible: true,
    locked: false,
    metadata: {},
    transform: createTransform({
      position: [5, 4, 8],
      rotation: [-20, 35, 0]
    }),
    fov: 45,
    focalLength: 35,
    near: 0.1,
    far: 1000,
    active: false
  };
}

export function createObjEntity(assetId: string, name: string): ObjEntity {
  return {
    id: createId("obj"),
    type: "obj",
    name,
    visible: true,
    locked: false,
    metadata: {},
    transform: createTransform({
      position: [2, 1, 0]
    }),
    assetId
  };
}

export function findObject(
  project: MineMotionProject,
  objectId: string | null
): ObjectLookupResult | null {
  if (!objectId) {
    return null;
  }

    const collections: MutableSceneCollection[] = [
    "characters",
    "cameras",
    "importedObjects",
    "lights"
  ] as const;

  for (const collection of collections) {
    const entity = project.scene[collection].find((item) => item.id === objectId);
    if (entity) {
      return { entity, collection };
    }
  }

  return null;
}

export function updateObjectTransform(
  project: MineMotionProject,
  objectId: string,
  transform: TransformData
): MineMotionProject {
  const lookup = findObject(project, objectId);
  if (!lookup) {
    return project;
  }

  return {
    ...project,
    scene: {
      ...project.scene,
      [lookup.collection]: project.scene[lookup.collection].map((entity) =>
        entity.id === objectId
          ? { ...entity, transform: cloneTransform(transform) }
          : entity
      )
    }
  };
}

export function updateObjectName(
  project: MineMotionProject,
  objectId: string,
  name: string
): MineMotionProject {
  const lookup = findObject(project, objectId);
  if (!lookup) return project;

  return updateObject(project, objectId, lookup.collection, {
    name: name.trim() || lookup.entity.name
  });
}

export function updateObjectVisibility(
  project: MineMotionProject,
  objectId: string,
  visible: boolean
): MineMotionProject {
  const lookup = findObject(project, objectId);
  if (!lookup) return project;

  return updateObject(project, objectId, lookup.collection, { visible });
}

export function updateObjectLocked(
  project: MineMotionProject,
  objectId: string,
  locked: boolean
): MineMotionProject {
  const lookup = findObject(project, objectId);
  if (!lookup) return project;

  return updateObject(project, objectId, lookup.collection, { locked });
}

export function updateProjectSettings(
  project: MineMotionProject,
  settings: Partial<ProjectSettings>
): MineMotionProject {
  const nextSettings = {
    ...project.projectSettings,
    ...settings
  };

  return {
    ...project,
    projectName: nextSettings.projectName,
    projectSettings: nextSettings,
    sky: {
      ...project.sky,
      preset: settings.defaultSkyPreset ?? project.sky.preset
    },
    world: project.world
      ? {
          ...project.world,
          sourcePath: settings.worldSourcePath ?? project.world.sourcePath
        }
      : project.world,
    animation: {
      ...project.animation,
      fps: settings.fps ?? project.animation.fps,
      durationFrames:
        settings.durationFrames ?? project.animation.durationFrames,
      currentFrame: Math.min(
        project.animation.currentFrame,
        settings.durationFrames ?? project.animation.durationFrames
      )
    }
  };
}

export function setActiveCamera(
  project: MineMotionProject,
  cameraId: string
): MineMotionProject {
  const exists = project.scene.cameras.some((camera) => camera.id === cameraId);
  if (!exists) return project;

  return {
    ...project,
    activeCameraId: cameraId,
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((camera) => ({
        ...camera,
        active: camera.id === cameraId
      }))
    }
  };
}

function updateObject(
  project: MineMotionProject,
  objectId: string,
  collection: MutableSceneCollection,
  patch: Partial<MineMotionProject["scene"][MutableSceneCollection][number]>
): MineMotionProject {
  return {
    ...project,
    scene: {
      ...project.scene,
      [collection]: project.scene[collection].map((entity) =>
        entity.id === objectId ? { ...entity, ...patch } : entity
      )
    }
  };
}
