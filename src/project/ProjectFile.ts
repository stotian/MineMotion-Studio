import type { SkyPresetId } from "../renderer/SkySystem";
import type { BlockPaletteStyle } from "../settings/SettingsTypes";
import type { AudioClip } from "../audio/AudioTypes";
import type { AssetLibraryData } from "../assets/library/AssetRecord";
import type { EffectInstance } from "../effects/EffectTypes";
import type { ExportSettings } from "../export/ExportTypes";
import type { FfmpegSettings } from "../export/ffmpeg/FfmpegSettings";
import type { RenderQueueState } from "../export/renderQueue/RenderJob";
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
import type { ProjectSchemaVersion } from "../core/serialization/SchemaVersion";
import type {
  SceneEntity,
  TransformData,
  Vector3Tuple
} from "../core/scene/SceneTypes";

export type {
  SceneEntity,
  SceneObjectType,
  TransformData,
  Vector3Tuple
} from "../core/scene/SceneTypes";
export {
  DEFAULT_TRANSFORM,
  cloneTransform,
  createTransform
} from "../core/scene/SceneTypes";

export type TerrainPresetId = "none" | "demo" | "flat" | "nether";

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

export type KeyframeInterpolation =
  | "constant"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "bezier";

export interface Keyframe<T = number | Vector3Tuple> {
  id?: string;
  frame: number;
  value: T;
  interpolation?: KeyframeInterpolation;
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
  markers: TimelineMarker[];
  clips: ReusableAnimationClip[];
  nlaTracks: NlaTrackData[];
}

export interface TimelineMarker {
  id: string;
  name: string;
  frame: number;
  color: string;
}

export interface ReusableAnimationClipTrack {
  property: AnimatableProperty;
  keyframes: Keyframe<Vector3Tuple>[];
}

export interface ReusableAnimationClip {
  id: string;
  name: string;
  description: string;
  targetType: "character" | "camera" | "object";
  durationFrames: number;
  tracks: ReusableAnimationClipTrack[];
  createdAt: string;
}

export interface NlaClipInstance {
  id: string;
  clipId: string;
  targetId: string;
  startFrame: number;
  durationFrames: number;
  timeScale: number;
  weight: number;
  muted: boolean;
}

export interface NlaTrackData {
  id: string;
  name: string;
  targetId: string;
  clips: NlaClipInstance[];
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
  schemaVersion: ProjectSchemaVersion;
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
  ffmpegSettings: FfmpegSettings;
  renderQueue: RenderQueueState;
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
