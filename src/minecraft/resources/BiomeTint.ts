import type { BlockId } from "../MinecraftWorldTypes";
import type {
  BiomeTintPresetId,
  BiomeTintSettings
} from "./ResourcePackTypes";

export const BIOME_TINT_PRESETS: Record<BiomeTintPresetId, BiomeTintSettings> = {
  plains: {
    enabled: true,
    presetId: "plains",
    grassColor: "#91bd59",
    foliageColor: "#77ab2f",
    waterColor: "#3f76e4"
  },
  forest: {
    enabled: true,
    presetId: "forest",
    grassColor: "#79c05a",
    foliageColor: "#59ae30",
    waterColor: "#3f76e4"
  },
  swamp: {
    enabled: true,
    presetId: "swamp",
    grassColor: "#6a7039",
    foliageColor: "#6a7039",
    waterColor: "#617b64"
  },
  desert: {
    enabled: true,
    presetId: "desert",
    grassColor: "#bfb755",
    foliageColor: "#aea42a",
    waterColor: "#3f76e4"
  },
  custom: {
    enabled: true,
    presetId: "custom",
    grassColor: "#91bd59",
    foliageColor: "#77ab2f",
    waterColor: "#3f76e4"
  }
};

export const DEFAULT_BIOME_TINT: BiomeTintSettings = {
  ...BIOME_TINT_PRESETS.plains,
  enabled: false
};

export function withBiomeTintDefaults(
  value: Partial<BiomeTintSettings> | undefined
): BiomeTintSettings {
  const presetId = isBiomeTintPresetId(value?.presetId)
    ? value.presetId
    : DEFAULT_BIOME_TINT.presetId;
  const preset = BIOME_TINT_PRESETS[presetId];
  return {
    ...preset,
    ...value,
    presetId,
    enabled: value?.enabled ?? DEFAULT_BIOME_TINT.enabled,
    grassColor: validColor(value?.grassColor, preset.grassColor),
    foliageColor: validColor(value?.foliageColor, preset.foliageColor),
    waterColor: validColor(value?.waterColor, preset.waterColor)
  };
}

export function resolveBiomeTint(
  blockId: BlockId,
  settings: BiomeTintSettings
): string | null {
  if (!settings.enabled) return null;
  if (blockId === "grass" || blockId === "grass_block") return settings.grassColor;
  if (blockId === "oak_leaves") return settings.foliageColor;
  if (blockId === "water") return settings.waterColor;
  return null;
}

function isBiomeTintPresetId(value: unknown): value is BiomeTintPresetId {
  return typeof value === "string" && value in BIOME_TINT_PRESETS;
}

function validColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}
