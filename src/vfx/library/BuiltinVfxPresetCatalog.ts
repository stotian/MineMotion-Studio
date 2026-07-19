import { BUILTIN_EFFECTS } from "../../effects/EffectRegistry";
import type { EffectDefinition, EffectType } from "../../effects/EffectTypes";
import { CURRENT_PROJECT_SCHEMA_VERSION } from "../../core/serialization/SchemaVersion";
import { createLegacyVfxRegistry } from "../compat/LegacyEffectAdapter";
import { VfxRegistry } from "../core/VfxRegistry";
import { measureLegacyVfxEffectWork } from "../runtime/VfxFrameBudget";
import {
  BUILTIN_VFX_PRESET_METADATA_VERSION,
  type BuiltinVfxPreset,
  type BuiltinVfxPresetCategory,
  type BuiltinVfxPresetMetadata
} from "./BuiltinVfxPresetTypes";
import { validateBuiltinVfxPresetCatalog } from "./BuiltinVfxPresetValidator";

const CATEGORY_BY_EFFECT: Record<EffectType, BuiltinVfxPresetCategory> = {
  lightningStrike: "lightning-electric",
  impactFrame: "combat",
  cameraShake: "screen-cinematic",
  flash: "screen-cinematic",
  speedLines: "movement-trails",
  shockwave: "combat",
  glowBurst: "magic-energy",
  fogPulse: "environment",
  vignettePulse: "screen-cinematic",
  colorGradeKeyframe: "screen-cinematic",
  cinematicBars: "screen-cinematic",
  explosionFlash: "fire-explosion"
};

const CAPABILITIES_BY_EFFECT: Record<
  EffectType,
  { preview: boolean; export: boolean; limitations: readonly string[] }
> = {
  lightningStrike: { preview: true, export: true, limitations: ["Some compatibility parameters are stored but not visualized."] },
  impactFrame: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] },
  cameraShake: { preview: true, export: true, limitations: ["Uses the compatibility camera renderer."] },
  flash: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] },
  speedLines: { preview: true, export: true, limitations: ["Uses fixed compatibility line geometry."] },
  shockwave: { preview: true, export: true, limitations: ["Uses compatibility Three.js ring geometry."] },
  glowBurst: { preview: true, export: true, limitations: ["Uses compatibility instanced cube particles."] },
  fogPulse: { preview: true, export: false, limitations: ["Animated fog pulse is currently preview-only."] },
  vignettePulse: { preview: false, export: true, limitations: ["Animated vignette pulse is currently export-only."] },
  colorGradeKeyframe: { preview: false, export: false, limitations: ["Stored timeline marker; no visual runtime is connected."] },
  cinematicBars: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] },
  explosionFlash: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] }
};

export const BUILTIN_VFX_PRESET_LOCALIZATION: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      BUILTIN_EFFECTS.map((definition) => [
        localizationKey(definition.type),
        definition.name
      ])
    )
  );

function localizationKey(type: EffectType): string {
  return `vfx.presets.${type}.name`;
}

function createMetadata(definition: EffectDefinition): BuiltinVfxPresetMetadata {
  const measured = measureLegacyVfxEffectWork(
    definition.type,
    definition.defaultParameters.count ?? 0
  );
  const capabilities = CAPABILITIES_BY_EFFECT[definition.type];
  return {
    version: BUILTIN_VFX_PRESET_METADATA_VERSION,
    id: definition.type,
    effectType: definition.type,
    definitionId: definition.type,
    category: CATEGORY_BY_EFFECT[definition.type],
    tags: [...definition.tags],
    localizationKey: localizationKey(definition.type),
    thumbnail: {
      kind: "generated",
      cacheKey: `vfx-preset:${definition.type}:v${BUILTIN_VFX_PRESET_METADATA_VERSION}`,
      state: "pending"
    },
    previewQuality: "medium",
    exportQuality: "final",
    compatibility: {
      maturity:
        definition.type === "colorGradeKeyframe"
          ? "experimental"
          : "compatibility",
      runtime: "compatibility-map",
      minProjectSchema: CURRENT_PROJECT_SCHEMA_VERSION,
      maxProjectSchema: CURRENT_PROJECT_SCHEMA_VERSION,
      capabilities: {
        editable: true,
        preview: capabilities.preview,
        export: capabilities.export
      },
      limitations: [...capabilities.limitations]
    },
    frameBudget: {
      effects: 1,
      particles: measured.particles,
      segments: measured.segments,
      stackWork: 1 + measured.particles + measured.segments
    }
  };
}

function freezePreset(preset: BuiltinVfxPreset): BuiltinVfxPreset {
  return Object.freeze({
    ...preset,
    metadata: Object.freeze({
      ...preset.metadata,
      tags: Object.freeze([...preset.metadata.tags]),
      thumbnail: Object.freeze({ ...preset.metadata.thumbnail }),
      compatibility: Object.freeze({
        ...preset.metadata.compatibility,
        capabilities: Object.freeze({
          ...preset.metadata.compatibility.capabilities
        }),
        limitations: Object.freeze([
          ...preset.metadata.compatibility.limitations
        ])
      }),
      frameBudget: Object.freeze({ ...preset.metadata.frameBudget })
    })
  });
}

export class BuiltinVfxPresetCatalog {
  private readonly presets: readonly BuiltinVfxPreset[];
  private readonly byId: ReadonlyMap<string, BuiltinVfxPreset>;

  constructor(presets: readonly BuiltinVfxPreset[]) {
    const validation = validateBuiltinVfxPresetCatalog(presets, {
      localization: BUILTIN_VFX_PRESET_LOCALIZATION
    });
    if (!validation.ok) {
      throw new RangeError(
        `Invalid built-in VFX preset catalog: ${validation.errors
          .map((error) => `${error.path}: ${error.message}`)
          .join(" ")}`
      );
    }
    const definitionRegistry = new VfxRegistry(
      presets.map((preset) => preset.definition)
    );
    this.presets = Object.freeze(
      presets.map((preset) =>
        freezePreset({
          ...preset,
          definition:
            definitionRegistry.get(preset.metadata.definitionId) ??
            preset.definition
        })
      )
    );
    this.byId = new Map(this.presets.map((preset) => [preset.metadata.id, preset]));
  }

  list(options: { includeExperimental?: boolean } = {}): readonly BuiltinVfxPreset[] {
    return options.includeExperimental === false
      ? this.presets.filter(
          (preset) => preset.metadata.compatibility.maturity !== "experimental"
        )
      : this.presets;
  }

  get(id: string): BuiltinVfxPreset | null {
    return this.byId.get(id) ?? null;
  }

  countStable(): number {
    return this.presets.filter(
      (preset) => preset.metadata.compatibility.maturity === "stable"
    ).length;
  }
}

function createCompatibilityPresets(): BuiltinVfxPreset[] {
  const registry = createLegacyVfxRegistry();
  return BUILTIN_EFFECTS.map((definition) => {
    const nativeDefinition = registry.get(definition.type);
    if (!nativeDefinition) {
      throw new RangeError(`Missing native VFX definition: ${definition.type}`);
    }
    return {
      metadata: createMetadata(definition),
      definition: nativeDefinition,
      localizedName: definition.name
    };
  });
}

export const builtinVfxPresetCatalog = new BuiltinVfxPresetCatalog(
  createCompatibilityPresets()
);
