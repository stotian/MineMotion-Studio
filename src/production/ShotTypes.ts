import type { ExportSettings } from "../export/ExportTypes";
import type { PostProcessingSettings } from "../rendering/postprocessing/PostProcessingTypes";
import type { LightingSettings } from "../lighting/LightingTypes";
import type { TransformData } from "../core/scene/SceneTypes";

export const SHOT_STATUSES = [
  "planned",
  "blocked",
  "ready",
  "rendering",
  "review",
  "approved",
  "final"
] as const;
export type ShotStatus = (typeof SHOT_STATUSES)[number];

export const PRODUCTION_MARKER_TYPES = [
  "dialogue",
  "sfx",
  "beat",
  "action",
  "camera",
  "vfx",
  "note",
  "warning"
] as const;
export type ProductionMarkerType = (typeof PRODUCTION_MARKER_TYPES)[number];

export const REAL_RENDER_PASSES = [
  "beauty",
  "alpha",
  "world",
  "characters",
  "vfx",
  "depth",
  "normals",
  "object-id"
] as const;
export type RenderPassId = (typeof REAL_RENDER_PASSES)[number];

export interface ShotReferenceImage {
  name: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  dataUrl: string;
}

export interface ShotValidationSnapshot {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checkedAt: string;
}

export interface ShotCameraVariantSnapshot {
  transform: TransformData;
  fov: number;
  focalLength: number;
  near: number;
  far: number;
  metadata: Record<string, unknown>;
}

export interface ShotLightVariantSnapshot {
  id: string;
  name: string;
  transform: TransformData;
  visible: boolean;
  intensity: number;
  color: string;
  metadata: Record<string, unknown>;
}

export interface ShotCreativeVariant {
  id: string;
  name: string;
  notes: string;
  rating: number;
  camera: ShotCameraVariantSnapshot;
  lighting: LightingSettings;
  lights: ShotLightVariantSnapshot[];
  postProcessing: PostProcessingSettings;
  renderPasses: readonly RenderPassId[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductionShot {
  id: string;
  takeGroupId: string;
  name: string;
  startFrame: number;
  endFrame: number;
  cameraId: string;
  status: ShotStatus;
  notes: string;
  thumbnail?: ShotReferenceImage;
  referenceImages: ShotReferenceImage[];
  renderPreset: ExportSettings;
  renderPasses: readonly RenderPassId[];
  postProcessingOverride?: PostProcessingSettings;
  outputName: string;
  outputFolder: string;
  enabled: boolean;
  takeNumber: number;
  revision: number;
  activeTake: boolean;
  approved: boolean;
  rating: number;
  favorite: boolean;
  rejected: boolean;
  reviewNotes: string;
  reviewTags: string[];
  creativeVariants: ShotCreativeVariant[];
  activeVariantId: string | null;
  validation: ShotValidationSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardCard {
  id: string;
  shotId: string | null;
  title: string;
  notes: string;
  durationFrames: number;
  cameraId: string;
  status: ShotStatus;
  referenceImage?: ShotReferenceImage;
}

export interface ShotProductionData {
  shots: ProductionShot[];
  storyboard: StoryboardCard[];
  activeShotId: string | null;
  handoffRoot: string;
  namingPattern: string;
}

export const DEFAULT_SHOT_PRODUCTION: ShotProductionData = Object.freeze({
  shots: [],
  storyboard: [],
  activeShotId: null,
  handoffRoot: "ProjectExports",
  namingPattern: "{shot}_T{take}_{pass}"
});
