import type { PostProcessingSettings } from "./PostProcessingTypes";

export type PostOperationId = "color-grade" | "bloom" | "vignette" | "grain" | "chromatic" | "pixelate" | "fog";

export interface PostProcessingOperation {
  id: PostOperationId;
  enabled: boolean;
  amount: number;
}

export interface PostProcessingPlan {
  enabled: boolean;
  settings: PostProcessingSettings;
  operations: PostProcessingOperation[];
  cssFilter: string;
}

export function createPostProcessingPlan(settings: PostProcessingSettings, quality: "draft" | "final" = "final"): PostProcessingPlan {
  const enabled = settings.enabled;
  const qualityScale = quality === "draft" ? 0.55 : 1;
  const operations: PostProcessingOperation[] = [
    { id: "color-grade", enabled, amount: 1 },
    { id: "bloom", enabled: enabled && settings.bloomIntensity > 0, amount: settings.bloomIntensity * qualityScale },
    { id: "vignette", enabled: enabled && settings.vignetteAmount > 0, amount: settings.vignetteAmount },
    { id: "grain", enabled: enabled && settings.grainAmount > 0, amount: settings.grainAmount * qualityScale },
    { id: "chromatic", enabled: enabled && settings.chromaticAberrationAmount > 0, amount: settings.chromaticAberrationAmount * qualityScale },
    { id: "pixelate", enabled: enabled && settings.pixelationAmount > 0, amount: settings.pixelationAmount },
    { id: "fog", enabled: enabled && settings.fogIntensity > 0, amount: settings.fogIntensity }
  ];
  return {
    enabled,
    settings,
    operations,
    cssFilter: enabled ? [
      `brightness(${settings.brightness * settings.exposure})`,
      `contrast(${settings.contrast})`,
      `saturate(${settings.saturation})`,
      `hue-rotate(${settings.hueShift}deg)`
    ].join(" ") : "none"
  };
}

export function getPostOperation(plan: PostProcessingPlan, id: PostOperationId): PostProcessingOperation {
  return plan.operations.find((operation) => operation.id === id) ?? { id, enabled: false, amount: 0 };
}
