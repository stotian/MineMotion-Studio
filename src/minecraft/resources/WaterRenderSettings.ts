import type { WaterRenderSettings } from "./ResourcePackTypes";

export const DEFAULT_WATER_RENDER_SETTINGS: WaterRenderSettings = Object.freeze({
  opacity: 0.58,
  roughness: 0.24,
  animationSpeed: 1,
  emissiveIntensity: 0
});

export function withWaterRenderDefaults(
  value: Partial<WaterRenderSettings> | undefined
): WaterRenderSettings {
  return {
    opacity: clamp(value?.opacity, 0.05, 1, DEFAULT_WATER_RENDER_SETTINGS.opacity),
    roughness: clamp(value?.roughness, 0, 1, DEFAULT_WATER_RENDER_SETTINGS.roughness),
    animationSpeed: clamp(
      value?.animationSpeed,
      0,
      8,
      DEFAULT_WATER_RENDER_SETTINGS.animationSpeed
    ),
    emissiveIntensity: clamp(
      value?.emissiveIntensity,
      0,
      2,
      DEFAULT_WATER_RENDER_SETTINGS.emissiveIntensity
    )
  };
}

function clamp(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}
