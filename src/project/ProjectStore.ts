import type {
  CameraEntity,
  CharacterEntity,
  LightEntity,
  MineMotionProject,
  ObjectLookupResult,
  ObjEntity,
  TransformData
} from "./ProjectFile";
import { cloneTransform, createTransform } from "./ProjectFile";

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function createInitialProject(): MineMotionProject {
  const now = new Date().toISOString();

  const defaultCamera: CameraEntity = {
    id: "camera_main",
    type: "camera",
    name: "Scene Camera",
    visible: true,
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
    transform: createTransform({
      position: [8, 12, 6]
    }),
    intensity: 1.2,
    color: "#ffffff"
  };

  return {
    schemaVersion: 1,
    projectName: "Untitled MineMotion Project",
    sky: {
      preset: "Day",
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
      fps: 24,
      durationFrames: 300,
      currentFrame: 0,
      isPlaying: false,
      tracks: []
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      appVersion: "0.1.0"
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

  const collections = [
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

