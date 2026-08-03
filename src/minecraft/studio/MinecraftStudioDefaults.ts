import type { MinecraftCreationSuiteData, MinecraftModDescriptor, PostStackLayer, QuickVfxFavorite, VoxelModelAsset, WorldEditOperation } from "./MinecraftStudioTypes";

export function createDefaultMinecraftCreationSuite(): MinecraftCreationSuiteData {
  return {
    schemaVersion: 1,
    worldStudio: {
      sourceMode: "imported-save",
      seed: "",
      minecraftVersion: "1.21.1",
      loader: "vanilla",
      biomePreset: "plains",
      exactWorldRequired: true,
      area: {
        dimension: "overworld",
        centerChunkX: 0,
        centerChunkZ: 0,
        radiusChunks: 4,
        minY: -64,
        maxY: 192,
        maxActiveChunks: 81,
        nearLodRadius: 2,
        mediumLodRadius: 4,
        unloadDistanceChunks: 10
      },
      mods: [],
      lastPlanWarnings: []
    },
    worldEdits: [],
    models: [],
    rigGroups: [],
    collisions: {
      enabled: false,
      worldCollision: true,
      entityCollision: true,
      visualize: false,
      autoResolveOnPlace: true,
      profiles: []
    },
    quickVfxFavorites: [],
    postStack: [],
    workspace: {
      activeTab: "world",
      selectedModelId: null,
      selectedRigGroupId: null
    }
  };
}

export function sanitizeMinecraftCreationSuite(value: unknown): MinecraftCreationSuiteData {
  const defaults = createDefaultMinecraftCreationSuite();
  if (!isRecord(value)) return defaults;
  const world = isRecord(value.worldStudio) ? value.worldStudio : {};
  const area = isRecord(world.area) ? world.area : {};
  const collisions = isRecord(value.collisions) ? value.collisions : {};
  const workspace = isRecord(value.workspace) ? value.workspace : {};
  const sourceMode = world.sourceMode === "seed-proxy" || world.sourceMode === "blank-stage" ? world.sourceMode : "imported-save";
  const loader = ["vanilla", "fabric", "forge", "neoforge", "quilt"].includes(String(world.loader))
    ? world.loader as MinecraftCreationSuiteData["worldStudio"]["loader"]
    : "vanilla";
  const biomePreset = ["plains", "forest", "desert", "snow", "nether", "end"].includes(String(world.biomePreset))
    ? world.biomePreset as MinecraftCreationSuiteData["worldStudio"]["biomePreset"]
    : "plains";
  const activeTab = ["world", "build", "model", "rig", "collision", "finish"].includes(String(workspace.activeTab))
    ? workspace.activeTab as MinecraftCreationSuiteData["workspace"]["activeTab"]
    : "world";
  return {
    schemaVersion: 1,
    worldStudio: {
      sourceMode,
      seed: text(world.seed, "", 256),
      minecraftVersion: text(world.minecraftVersion, defaults.worldStudio.minecraftVersion, 32),
      loader,
      biomePreset,
      exactWorldRequired: world.exactWorldRequired !== false,
      area: {
        dimension: sanitizeDimension(area.dimension),
        centerChunkX: integer(area.centerChunkX, -30_000_000, 30_000_000, 0),
        centerChunkZ: integer(area.centerChunkZ, -30_000_000, 30_000_000, 0),
        radiusChunks: integer(area.radiusChunks, 0, 32, 4),
        minY: integer(area.minY, -128, 1024, -64),
        maxY: integer(area.maxY, -127, 2048, 192),
        maxActiveChunks: integer(area.maxActiveChunks, 1, 1024, 81),
        nearLodRadius: integer(area.nearLodRadius, 0, 16, 2),
        mediumLodRadius: integer(area.mediumLodRadius, 0, 32, 4),
        unloadDistanceChunks: integer(area.unloadDistanceChunks, 1, 64, 10)
      },
      mods: Array.isArray(world.mods) ? world.mods.slice(0, 512).flatMap(sanitizeMod) : [],
      lastPlanWarnings: stringArray(world.lastPlanWarnings, 32, 240)
    },
    worldEdits: Array.isArray(value.worldEdits) ? value.worldEdits.slice(0, 512).flatMap(sanitizeWorldEdit) : [],
    models: Array.isArray(value.models) ? value.models.slice(0, 128).flatMap(sanitizeModel) : [],
    rigGroups: Array.isArray(value.rigGroups) ? value.rigGroups.slice(0, 128).flatMap((entry) => sanitizeRigGroup(entry)) : [],
    collisions: {
      enabled: collisions.enabled === true,
      worldCollision: collisions.worldCollision !== false,
      entityCollision: collisions.entityCollision !== false,
      visualize: collisions.visualize === true,
      autoResolveOnPlace: collisions.autoResolveOnPlace !== false,
      profiles: Array.isArray(collisions.profiles) ? collisions.profiles.slice(0, 2048).flatMap(sanitizeCollisionProfile) : []
    },
    quickVfxFavorites: Array.isArray(value.quickVfxFavorites) ? value.quickVfxFavorites.slice(0, 64).flatMap(sanitizeFavorite) : [],
    postStack: Array.isArray(value.postStack) ? value.postStack.slice(0, 16).flatMap(sanitizePostLayer) : [],
    workspace: {
      activeTab,
      selectedModelId: nullableText(workspace.selectedModelId, 128),
      selectedRigGroupId: nullableText(workspace.selectedRigGroupId, 128)
    }
  };
}

function sanitizeMod(value: unknown): MinecraftModDescriptor[] {
  if (!isRecord(value)) return [];
  const id = safeId(value.id, "mod");
  const loader = ["fabric", "forge", "neoforge", "quilt", "any"].includes(String(value.loader))
    ? value.loader as MinecraftModDescriptor["loader"]
    : "any";
  const source = value.source === "resource-pack" || value.source === "blockbench" ? value.source : "manifest";
  return [{
    id,
    name: text(value.name, id, 120),
    version: text(value.version, "unknown", 64),
    loader,
    enabled: value.enabled !== false,
    namespace: safeNamespace(value.namespace, id),
    entityIds: stringArray(value.entityIds, 512, 160),
    blockIds: stringArray(value.blockIds, 4096, 160),
    assetIds: stringArray(value.assetIds, 4096, 160),
    source,
    warnings: stringArray(value.warnings, 32, 240)
  }];
}

function sanitizeWorldEdit(value: unknown): WorldEditOperation[] {
  if (!isRecord(value)) return [];
  const kind = ["set", "erase", "fill", "replace", "clone"].includes(String(value.kind))
    ? value.kind as WorldEditOperation["kind"]
    : "set";
  return [{
    id: safeId(value.id, "edit"),
    name: text(value.name, "World edit", 120),
    kind,
    enabled: value.enabled !== false,
    from: vector(value.from),
    to: vector(value.to),
    destination: Array.isArray(value.destination) ? vector(value.destination) : undefined,
    blockName: nullableText(value.blockName, 180) ?? undefined,
    matchBlockName: nullableText(value.matchBlockName, 180) ?? undefined,
    createdAt: text(value.createdAt, new Date(0).toISOString(), 64)
  }];
}

function sanitizeModel(value: unknown): VoxelModelAsset[] {
  if (!isRecord(value)) return [];
  const id = safeId(value.id, "voxel_model");
  const now = new Date(0).toISOString();
  return [{
    id,
    name: text(value.name, "Voxel model", 120),
    origin: vector(value.origin),
    cubes: Array.isArray(value.cubes) ? value.cubes.slice(0, 4096).flatMap((cube, index) => {
      if (!isRecord(cube)) return [];
      return [{
        id: safeId(cube.id, `${id}_cube_${index + 1}`),
        name: text(cube.name, `Cube ${index + 1}`, 120),
        position: vector(cube.position),
        size: vector(cube.size, [1, 1, 1]).map((part) => Math.max(0.01, Math.abs(part))) as [number, number, number],
        color: color(cube.color, "#8f98a3"),
        materialName: text(cube.materialName, "default", 80),
        visible: cube.visible !== false
      }];
    }) : [],
    tags: stringArray(value.tags, 32, 80),
    compiledObjAssetId: nullableText(value.compiledObjAssetId, 128),
    sceneObjectId: nullableText(value.sceneObjectId, 128),
    createdAt: text(value.createdAt, now, 64),
    updatedAt: text(value.updatedAt, now, 64)
  }];
}

function sanitizeRigGroup(value: unknown): MinecraftCreationSuiteData["rigGroups"] {
  if (!isRecord(value)) return [];
  return [{
    id: safeId(value.id, "rig_group"),
    name: text(value.name, "Rig group", 120),
    characterIds: stringArray(value.characterIds, 256, 128),
    defaultPresetId: text(value.defaultPresetId, "walk-cycle", 128),
    staggerFrames: integer(value.staggerFrames, 0, 2400, 0),
    mirrorAlternating: value.mirrorAlternating === true,
    speed: number(value.speed, 0.05, 20, 1),
    createdAt: text(value.createdAt, new Date(0).toISOString(), 64)
  }];
}

function sanitizeCollisionProfile(value: unknown): MinecraftCreationSuiteData["collisions"]["profiles"] {
  if (!isRecord(value) || !text(value.entityId, "", 128)) return [];
  return [{
    entityId: text(value.entityId, "", 128),
    enabled: value.enabled !== false,
    shape: value.shape === "capsule" ? "capsule" : "box",
    size: vector(value.size, [0.8, 1.8, 0.8]).map((part) => Math.max(0.01, Math.abs(part))) as [number, number, number],
    offset: vector(value.offset),
    layer: integer(value.layer, 0, 31, 0),
    mask: integer(value.mask, 0, 0x7fffffff, 0x7fffffff)
  }];
}

function sanitizeFavorite(value: unknown): QuickVfxFavorite[] {
  if (!isRecord(value)) return [];
  return [{
    id: safeId(value.id, "vfx_favorite"),
    presetId: text(value.presetId, "nativeExplosion", 128),
    name: text(value.name, "Quick VFX", 120),
    intensity: number(value.intensity, 0.05, 8, 1),
    durationScale: number(value.durationScale, 0.1, 8, 1)
  }];
}

function sanitizePostLayer(value: unknown): PostStackLayer[] {
  if (!isRecord(value)) return [];
  return [{
    id: safeId(value.id, "post_layer"),
    name: text(value.name, "Post layer", 120),
    presetId: text(value.presetId, "clean-preview", 80),
    weight: number(value.weight, 0, 1, 1),
    enabled: value.enabled !== false
  }];
}

function vector(value: unknown, fallback: [number, number, number] = [0, 0, 0]): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) return [...fallback];
  return [number(value[0], -30_000_000, 30_000_000, fallback[0]), number(value[1], -4096, 4096, fallback[1]), number(value[2], -30_000_000, 30_000_000, fallback[2])];
}

function sanitizeDimension(value: unknown): MinecraftCreationSuiteData["worldStudio"]["area"]["dimension"] {
  if (value === "overworld" || value === "nether" || value === "end") return value;
  if (typeof value === "string" && value.startsWith("custom:") && value.length <= 180) return value as `custom:${string}`;
  return "overworld";
}

function text(value: unknown, fallback: string, max: number): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}
function nullableText(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}
function safeId(value: unknown, fallback: string): string {
  const candidate = text(value, fallback, 128).replace(/[^a-zA-Z0-9._:-]+/g, "_");
  return candidate || fallback;
}
function safeNamespace(value: unknown, fallback: string): string {
  return text(value, fallback, 80).toLowerCase().replace(/[^a-z0-9_.-]+/g, "_") || "minecraft";
}
function stringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim().slice(0, maxLength)))].slice(0, maxItems) : [];
}
function integer(value: unknown, min: number, max: number, fallback: number): number {
  return Math.round(number(value, min, max, fallback));
}
function number(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}
function color(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
