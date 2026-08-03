import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import type { MinecraftDimensionId } from "../import/MinecraftChunkTypes";
import type { RigPresetId } from "../../rigs/RigTypes";

export type MinecraftModLoader = "vanilla" | "fabric" | "forge" | "neoforge" | "quilt";
export type MinecraftWorldSourceMode = "imported-save" | "seed-proxy" | "blank-stage";
export type StudioBiomePreset = "plains" | "forest" | "desert" | "snow" | "nether" | "end";

export interface MinecraftModDescriptor {
  id: string;
  name: string;
  version: string;
  loader: Exclude<MinecraftModLoader, "vanilla"> | "any";
  enabled: boolean;
  namespace: string;
  entityIds: string[];
  blockIds: string[];
  assetIds: string[];
  source: "manifest" | "resource-pack" | "blockbench";
  warnings: string[];
}

export interface MinecraftBoundedArea {
  dimension: MinecraftDimensionId;
  centerChunkX: number;
  centerChunkZ: number;
  radiusChunks: number;
  minY: number;
  maxY: number;
  maxActiveChunks: number;
  nearLodRadius: number;
  mediumLodRadius: number;
  unloadDistanceChunks: number;
}

export interface MinecraftWorldStudioSettings {
  sourceMode: MinecraftWorldSourceMode;
  seed: string;
  minecraftVersion: string;
  loader: MinecraftModLoader;
  biomePreset: StudioBiomePreset;
  exactWorldRequired: boolean;
  area: MinecraftBoundedArea;
  mods: MinecraftModDescriptor[];
  lastPlanWarnings: string[];
}

export type WorldEditOperationKind = "set" | "erase" | "fill" | "replace" | "clone";

export interface WorldEditOperation {
  id: string;
  name: string;
  kind: WorldEditOperationKind;
  enabled: boolean;
  from: Vector3Tuple;
  to: Vector3Tuple;
  destination?: Vector3Tuple;
  blockName?: string;
  matchBlockName?: string;
  createdAt: string;
}

export interface VoxelModelCube {
  id: string;
  name: string;
  position: Vector3Tuple;
  size: Vector3Tuple;
  color: string;
  materialName: string;
  visible: boolean;
}

export interface VoxelModelAsset {
  id: string;
  name: string;
  origin: Vector3Tuple;
  cubes: VoxelModelCube[];
  tags: string[];
  compiledObjAssetId: string | null;
  sceneObjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MultiRigGroup {
  id: string;
  name: string;
  characterIds: string[];
  defaultPresetId: string;
  staggerFrames: number;
  mirrorAlternating: boolean;
  speed: number;
  createdAt: string;
}

export type CollisionShape = "box" | "capsule";
export interface EntityCollisionProfile {
  entityId: string;
  enabled: boolean;
  shape: CollisionShape;
  size: Vector3Tuple;
  offset: Vector3Tuple;
  layer: number;
  mask: number;
}

export interface CollisionStudioSettings {
  enabled: boolean;
  worldCollision: boolean;
  entityCollision: boolean;
  visualize: boolean;
  autoResolveOnPlace: boolean;
  profiles: EntityCollisionProfile[];
}

export interface QuickVfxFavorite {
  id: string;
  presetId: string;
  name: string;
  intensity: number;
  durationScale: number;
}

export interface PostStackLayer {
  id: string;
  name: string;
  presetId: string;
  weight: number;
  enabled: boolean;
}

export interface MinecraftStudioWorkspaceState {
  activeTab: "world" | "build" | "model" | "rig" | "collision" | "finish";
  selectedModelId: string | null;
  selectedRigGroupId: string | null;
}

export interface MinecraftCreationSuiteData {
  schemaVersion: 1;
  worldStudio: MinecraftWorldStudioSettings;
  worldEdits: WorldEditOperation[];
  models: VoxelModelAsset[];
  rigGroups: MultiRigGroup[];
  collisions: CollisionStudioSettings;
  quickVfxFavorites: QuickVfxFavorite[];
  postStack: PostStackLayer[];
  workspace: MinecraftStudioWorkspaceState;
}

export interface MinecraftEntityCatalogEntry {
  id: string;
  name: string;
  source: "vanilla" | "mod";
  namespace: string;
  rigPresetId: RigPresetId;
  modelType: "steve" | "alex" | "mob" | "generic";
  tags: string[];
  modId?: string;
}
