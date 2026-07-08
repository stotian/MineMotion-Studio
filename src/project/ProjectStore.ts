import type {
  CameraEntity,
  CharacterEntity,
  LightEntity,
  MineMotionProject,
  MutableSceneCollection,
  ObjectLookupResult,
  ObjEntity,
  ProjectSettings,
  TransformData
} from "./ProjectFile";
import { cloneTransform, createTransform } from "./ProjectFile";
import type { AppSettings } from "../settings/AppSettings";

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
    near: 0.1,
    far: 1000
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
    schemaVersion: 2,
    projectName: projectSettings.projectName,
    projectSettings,
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
      obj: []
    },
    animation: {
      fps: projectSettings.fps,
      durationFrames: projectSettings.durationFrames,
      currentFrame: 0,
      isPlaying: false,
      tracks: []
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      appVersion: "0.1.5"
    }
  };
}

export function createCharacter(
  name = "Minecraft Character",
  position: [number, number, number] = [0, 1.05, 0]
): CharacterEntity {
  return {
    id: createId("character"),
    type: "character",
    name,
    visible: true,
    locked: false,
    metadata: {},
    transform: createTransform({ position }),
    rigPreset: "default_steve",
    boneRotations: {
      root: [0, 0, 0],
      body: [0, 0, 0],
      head: [0, 0, 0],
      leftArm: [0, 0, -8],
      rightArm: [0, 0, 8],
      leftLeg: [0, 0, 0],
      rightLeg: [0, 0, 0]
    }
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
    near: 0.1,
    far: 1000
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
