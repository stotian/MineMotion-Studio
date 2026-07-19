import type { EffectType } from "../../effects/EffectTypes";
import type { VfxDefinition } from "../core/VfxDefinition";
import type { VfxQuality } from "../core/VfxEvaluationContext";
import type { VfxFrameWork } from "../runtime/VfxFrameBudget";

export const BUILTIN_VFX_PRESET_METADATA_VERSION = 1 as const;

export type BuiltinVfxPresetCategory =
  | "combat"
  | "lightning-electric"
  | "fire-explosion"
  | "magic-energy"
  | "environment"
  | "screen-cinematic"
  | "movement-trails";

export type BuiltinVfxPresetMaturity =
  | "stable"
  | "compatibility"
  | "experimental";

export type BuiltinVfxPresetRuntime =
  | "native-primitives"
  | "compatibility-map";

export type BuiltinVfxPresetThumbnail =
  | {
      kind: "generated";
      cacheKey: string;
      state: "pending" | "ready";
    }
  | {
      kind: "asset";
      assetId: string;
    };

export interface BuiltinVfxPresetCapabilities {
  editable: boolean;
  preview: boolean;
  export: boolean;
}

export interface BuiltinVfxPresetCompatibility {
  maturity: BuiltinVfxPresetMaturity;
  runtime: BuiltinVfxPresetRuntime;
  minProjectSchema: number;
  maxProjectSchema: number;
  capabilities: BuiltinVfxPresetCapabilities;
  limitations: readonly string[];
}

export interface BuiltinVfxPresetMetadata {
  version: typeof BUILTIN_VFX_PRESET_METADATA_VERSION;
  id: string;
  effectType: EffectType;
  definitionId: string;
  category: BuiltinVfxPresetCategory;
  tags: readonly string[];
  localizationKey: string;
  thumbnail: BuiltinVfxPresetThumbnail;
  previewQuality: VfxQuality;
  exportQuality: VfxQuality;
  compatibility: BuiltinVfxPresetCompatibility;
  frameBudget: VfxFrameWork;
}

export interface BuiltinVfxPreset {
  metadata: BuiltinVfxPresetMetadata;
  definition: VfxDefinition;
  localizedName: string;
}
