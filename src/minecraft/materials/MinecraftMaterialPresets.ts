import type { BlockId } from "../MinecraftWorldTypes";
import type {
  MinecraftMaterialPreset,
  MinecraftMaterialPresetId,
  MinecraftMaterialSettings
} from "./MinecraftMaterialTypes";

export const MINECRAFT_MATERIAL_PRESETS: Record<
  MinecraftMaterialPresetId,
  MinecraftMaterialPreset
> = {
  solid: {
    id: "solid",
    name: "Solid Block",
    description: "Opaque, rough Minecraft block material.",
    roughness: 0.92,
    metalness: 0,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthWrite: true,
    emissiveColor: "#000000",
    emissiveIntensity: 0
  },
  transparent: {
    id: "transparent",
    name: "Transparent Block",
    description: "General alpha-blended block material.",
    roughness: 0.75,
    metalness: 0,
    transparent: true,
    opacity: 0.72,
    alphaTest: 0.05,
    depthWrite: false,
    emissiveColor: "#000000",
    emissiveIntensity: 0
  },
  leaves: {
    id: "leaves",
    name: "Leaves",
    description: "Cutout foliage with biome tint support.",
    roughness: 0.88,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
    alphaTest: 0.35,
    depthWrite: true,
    emissiveColor: "#000000",
    emissiveIntensity: 0
  },
  water: {
    id: "water",
    name: "Water Placeholder",
    description: "Translucent water until animated fluid shaders are available.",
    roughness: 0.24,
    metalness: 0,
    transparent: true,
    opacity: 0.58,
    alphaTest: 0,
    depthWrite: false,
    emissiveColor: "#000000",
    emissiveIntensity: 0
  },
  glass: {
    id: "glass",
    name: "Glass",
    description: "Low-roughness transparent glass block.",
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.34,
    alphaTest: 0.04,
    depthWrite: false,
    emissiveColor: "#000000",
    emissiveIntensity: 0
  },
  "torch-emissive": createEmissivePreset(
    "torch-emissive",
    "Torch Emissive",
    "#ffb14a",
    1.45
  ),
  "glowstone-emissive": createEmissivePreset(
    "glowstone-emissive",
    "Glowstone Emissive",
    "#ffd37a",
    1.2
  ),
  "lava-emissive": createEmissivePreset(
    "lava-emissive",
    "Lava Emissive",
    "#ff5a1f",
    1.7
  ),
  "redstone-lamp-emissive": createEmissivePreset(
    "redstone-lamp-emissive",
    "Redstone Lamp Emissive",
    "#ff9c45",
    1.35
  )
};

export const DEFAULT_MINECRAFT_MATERIAL_SETTINGS: MinecraftMaterialSettings = {
  defaultPresetId: "solid",
  overrides: {}
};

export function getMaterialPresetForBlock(
  blockId: BlockId,
  settings: MinecraftMaterialSettings = DEFAULT_MINECRAFT_MATERIAL_SETTINGS
): MinecraftMaterialPreset {
  const override = settings.overrides[blockId];
  const presetId = override ?? inferPresetId(blockId) ?? settings.defaultPresetId;
  return MINECRAFT_MATERIAL_PRESETS[presetId];
}

export function getEmissivePlaceholderPreset(
  blockName: "torch" | "glowstone" | "lava" | "redstone_lamp"
): MinecraftMaterialPreset {
  const mapping = {
    torch: "torch-emissive",
    glowstone: "glowstone-emissive",
    lava: "lava-emissive",
    redstone_lamp: "redstone-lamp-emissive"
  } as const;
  return MINECRAFT_MATERIAL_PRESETS[mapping[blockName]];
}

export function withMinecraftMaterialDefaults(
  value: Partial<MinecraftMaterialSettings> | undefined
): MinecraftMaterialSettings {
  const defaultPresetId = isMaterialPresetId(value?.defaultPresetId)
    ? value.defaultPresetId
    : DEFAULT_MINECRAFT_MATERIAL_SETTINGS.defaultPresetId;
  const overrides: MinecraftMaterialSettings["overrides"] = {};
  if (value?.overrides && typeof value.overrides === "object") {
    for (const [blockId, presetId] of Object.entries(value.overrides)) {
      if (isMaterialPresetId(presetId)) {
        overrides[blockId as BlockId] = presetId;
      }
    }
  }
  return { defaultPresetId, overrides };
}

export function isMaterialPresetId(value: unknown): value is MinecraftMaterialPresetId {
  return typeof value === "string" && value in MINECRAFT_MATERIAL_PRESETS;
}

function inferPresetId(blockId: BlockId): MinecraftMaterialPresetId | null {
  if (blockId === "oak_leaves") return "leaves";
  if (blockId === "water") return "water";
  if (blockId === "glass") return "glass";
  if (blockId === "air") return "transparent";
  return null;
}

function createEmissivePreset(
  id: Extract<MinecraftMaterialPresetId, `${string}-emissive`>,
  name: string,
  emissiveColor: string,
  emissiveIntensity: number
): MinecraftMaterialPreset {
  return {
    id,
    name,
    description: `${name} placeholder for Minecraft light-emitting blocks.`,
    roughness: 0.78,
    metalness: 0,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthWrite: true,
    emissiveColor,
    emissiveIntensity
  };
}
