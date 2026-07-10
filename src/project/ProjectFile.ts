import type { SkyPresetId } from "../renderer/SkySystem";
import type { BlockPaletteStyle } from "../settings/SettingsTypes";
import type { AudioClip } from "../audio/AudioTypes";
import type { AssetLibraryData } from "../assets/library/AssetRecord";
import type { EffectInstance } from "../effects/EffectTypes";
import type { ExportSettings } from "../export/ExportTypes";
import type {
  ImportedChunkData,
  ImportedChunkRange,
  MinecraftDimensionId,
  WorldImportPerformanceEstimate,
  WorldRenderOptions
} from "../minecraft/import/MinecraftChunkTypes";
import type { ProjectPackageMetadata } from "./package/PackageTypes";
import type { PostProcessingSettings } from "../rendering/postprocessing/PostProcessingTypes";
import type { LightingSettings } from "../lighting/LightingTypes";
import type {
  MinecraftResourceSettings,
  ResourcePackAsset
} from "../minecraft/resources/ResourcePackTypes";
import type {
  BoneAnimationTrack,
  BlockbenchModelAsset,
  CharacterAttachment,
  MinecraftSkinAsset,
  RigPresetId,
  RigProjectData
} from "../rigs/RigTypes";

export type Vector3Tuple = [number, number, number];
export type TerrainPresetId = "none" | "demo" | "flat" | "nether";

export interface TransformData {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export type SceneObjectType =
  | "world"
  | "chunkMesh"
  | "character"
  | "rigBone"
  | "camera"
  | "obj"
  | "light"
  | "empty"
  | "helper";

export interface SceneEntity {
  id: string;
  type: SceneObjectType;
  name: string;
  transform: TransformData;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, unknown>;
}

export interface CharacterEntity extends SceneEntity {
  type: "character";
  rigPreset: RigPresetId;
  modelType?: "steve" | "alex" | "mob" | "generic";
  boneRotations: Record<string, Vector3Tuple>;
  selectedBoneId?: string;
  skin?: MinecraftSkinAsset | null;
  attachments?: CharacterAttachment[];
  boneKeyframes?: BoneAnimationTrack[];
}

export interface CameraEntity extends SceneEntity {
  type: "camera";
  fov: number;
  focalLength: number;
  near: number;
  far: number;
  active: boolean;
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
  estimatedChunks?: number;
}

export interface ImportedWorldSummary {
  sourceName: string;
  sourcePath?: string;
  levelDatFound: boolean;
  levelName?: string;
  spawn?: Vector3Tuple;
  dimensions: WorldDimensionSummary[];
  selectedDimension?: MinecraftDimensionId;
  importedChunkRanges?: ImportedChunkRange[];
  importedChunks?: ImportedChunkData[];
  unknownBlockMappings?: Record<string, string>;
  unknownBlockCount?: number;
  importSettings?: ImportedChunkRange;
  performanceEstimate?: WorldImportPerformanceEstimate;
  cachedMesh?: {
    embedded: boolean;
    generatedAt: string;
    chunkCount: number;
    blockCount: number;
  };
  renderOptions?: WorldRenderOptions;
  sourcePathMissing?: boolean;
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
  | "transform.scale"
  | `bone.rotation.${string}`;

export interface AnimationTrack {
  id: string;
  targetId: string;
  property: AnimatableProperty;
  keyframes: Keyframe<Vector3Tuple>[];
}

export type TimelineTrackType =
  | "transform"
  | "rig"
  | "camera"
  | "effect"
  | "audio"
  | "postProcessing"
  | "sky";

export interface TimelineItem {
  id: string;
  type: TimelineTrackType;
  label: string;
  startFrame: number;
  durationFrames: number;
  targetId: string;
  boneId?: string;
  effectId?: string;
  audioClipId?: string;
  environmentKeyframeId?: string;
}

export interface TimelineTrackLane {
  id: string;
  type: TimelineTrackType;
  name: string;
  items: TimelineItem[];
}

export interface TimelineData {
  fps: number;
  durationFrames: number;
  currentFrame: number;
  isPlaying: boolean;
  tracks: AnimationTrack[];
  timelineTracks: TimelineTrackLane[];
}

export interface ProjectSettings {
  schemaVersion: 1;
  projectName: string;
  fps: number;
  durationFrames: number;
  defaultSkyPreset: SkyPresetId;
  worldSourcePath: string;
  renderResolutionPreset: "720p" | "1080p" | "1440p" | "4k" | "custom";
  author: string;
  notes: string;
  terrainPreset: TerrainPresetId;
  blockPaletteStyle: BlockPaletteStyle;
}

export interface RenderSettings {
  resolutionPreset: "720p" | "1080p" | "1440p" | "4k" | "custom";
  customWidth: number;
  customHeight: number;
  aspectRatio: "16:9" | "2.35:1" | "1:1" | "9:16";
  renderPreviewEnabled: boolean;
  cinematicBarsEnabled: boolean;
  cinematicBarsRatio: "16:9" | "2.35:1";
}

export interface MineMotionProject {
  schemaVersion: 7;
  projectName: string;
  projectSettings: ProjectSettings;
  packageMetadata: ProjectPackageMetadata;
  activeCameraId: string;
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
    skins: MinecraftSkinAsset[];
    blockbench: BlockbenchModelAsset[];
    resourcePacks: ResourcePackAsset[];
  };
  minecraftResources: MinecraftResourceSettings;
  lighting: LightingSettings;
  rigs: RigProjectData;
  assetLibrary: AssetLibraryData;
  effects: {
    instances: EffectInstance[];
  };
  audio: {
    clips: AudioClip[];
  };
  postProcessing: PostProcessingSettings;
  renderSettings: RenderSettings;
  exportSettings: ExportSettings;
  performanceSettings: {
    showDiagnostics: boolean;
    targetFps: number;
    renderQualityDuringPlayback: "draft" | "balanced" | "final";
    cacheStaticTerrain: boolean;
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

export type MutableSceneCollection =
  | "characters"
  | "cameras"
  | "importedObjects"
  | "lights";

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
