import type { SkyPresetId } from "../renderer/SkySystem";

export type Vector3Tuple = [number, number, number];

export interface TransformData {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export type SceneObjectType =
  | "world"
  | "character"
  | "camera"
  | "obj"
  | "light";

export interface SceneEntity {
  id: string;
  type: SceneObjectType;
  name: string;
  transform: TransformData;
  visible: boolean;
}

export interface CharacterEntity extends SceneEntity {
  type: "character";
  rigPreset: "default_steve";
  boneRotations: Record<string, Vector3Tuple>;
}

export interface CameraEntity extends SceneEntity {
  type: "camera";
  fov: number;
  near: number;
  far: number;
}

export interface ObjEntity extends SceneEntity {
  type: "obj";
  assetId: string;
}

export interface LightEntity extends SceneEntity {
  type: "light";
  intensity: number;
  color: string;
}

export interface ImportedObjAsset {
  id: string;
  name: string;
  rawObj: string;
  importedAt: string;
}

export interface WorldDimensionSummary {
  id: "overworld" | "nether" | "end";
  label: string;
  regionFiles: string[];
}

export interface ImportedWorldSummary {
  sourceName: string;
  sourcePath?: string;
  levelDatFound: boolean;
  levelName?: string;
  spawn?: Vector3Tuple;
  dimensions: WorldDimensionSummary[];
  importedAt: string;
  notes: string[];
}

export interface Keyframe<T = number | Vector3Tuple> {
  frame: number;
  value: T;
}

export type AnimatableProperty =
  | "transform.position"
  | "transform.rotation"
  | "transform.scale";

export interface AnimationTrack {
  id: string;
  targetId: string;
  property: AnimatableProperty;
  keyframes: Keyframe<Vector3Tuple>[];
}

export interface TimelineData {
  fps: number;
  durationFrames: number;
  currentFrame: number;
  isPlaying: boolean;
  tracks: AnimationTrack[];
}

export interface MineMotionProject {
  schemaVersion: 1;
  projectName: string;
  sky: {
    preset: SkyPresetId;
    customColor: string;
  };
  world: ImportedWorldSummary | null;
  scene: {
    characters: CharacterEntity[];
    cameras: CameraEntity[];
    importedObjects: ObjEntity[];
    lights: LightEntity[];
  };
  assets: {
    obj: ImportedObjAsset[];
  };
  animation: TimelineData;
  metadata: {
    createdAt: string;
    updatedAt: string;
    appVersion: string;
  };
}

export interface ObjectLookupResult {
  entity: SceneEntity;
  collection: "characters" | "cameras" | "importedObjects" | "lights";
}

export const DEFAULT_TRANSFORM: TransformData = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

export function cloneTransform(transform: TransformData): TransformData {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}

export function createTransform(
  partial: Partial<TransformData> = {}
): TransformData {
  return {
    position: partial.position ? [...partial.position] : [0, 0, 0],
    rotation: partial.rotation ? [...partial.rotation] : [0, 0, 0],
    scale: partial.scale ? [...partial.scale] : [1, 1, 1]
  };
}

