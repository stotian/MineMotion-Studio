import { createEffectInstance } from "../../effects/EffectRegistry";
import type { EffectInstance } from "../../effects/EffectTypes";
import { adaptLegacyEffectInstance } from "../compat/LegacyEffectAdapter";
import { compileVfxAuthoringDocument } from "../authoring/VfxAuthoringCompiler";
import { VFX_CUSTOM_RECIPE_VERSION } from "../core/VfxInstance";
import { generateVfxDescriptorPreviewDataUrl } from "../library/VfxPresetPreviewCache";
import { synchronizeLegacyEffectNativeVfx } from "../serialization/VfxProjectMigration";
import type { InstalledVfxPackage, VfxPackageRegistry } from "./VfxPackageRegistry";

export interface InstalledCustomVfxPreset {
  packageId: string;
  packageVersion: string;
  displayName: string;
  description: string;
  author: string;
  license: string;
  space: InstalledVfxPackage["archive"]["document"]["space"];
  durationFrames: number;
  previewDataUrl: string;
}

export type InstalledVfxSourceStatus =
  | "available"
  | "disabled"
  | "missing"
  | "version-mismatch";

export function listEnabledInstalledVfxPresets(
  registry: VfxPackageRegistry
): readonly InstalledCustomVfxPreset[] {
  return Object.freeze(
    registry.packages
      .filter((entry) => entry.enabled)
      .map((entry) => {
        const compilation = compileVfxAuthoringDocument(entry.archive.document);
        if (!compilation.ok) {
          throw new Error(`Installed VFX package ${entry.id} no longer compiles.`);
        }
        const { manifest, document } = entry.archive;
        return Object.freeze({
          packageId: entry.id,
          packageVersion: entry.version,
          displayName: manifest.displayName,
          description: manifest.description,
          author: manifest.author,
          license: manifest.license,
          space: document.space,
          durationFrames: document.durationFrames,
          previewDataUrl: generateVfxDescriptorPreviewDataUrl(
            compilation.value.descriptors,
            manifest.displayName,
            `${entry.id}:${entry.version}`
          )
        });
      })
      .sort((left, right) =>
        left.displayName.localeCompare(right.displayName) ||
        left.packageId.localeCompare(right.packageId)
      )
  );
}

export function createInstalledVfxEffect(
  entry: InstalledVfxPackage,
  options: {
    id: string;
    startFrame: number;
    targetObjectId?: string;
  }
): EffectInstance {
  if (!entry.enabled) throw new Error(`VFX package ${entry.id} is disabled.`);
  const compilation = compileVfxAuthoringDocument(entry.archive.document);
  if (!compilation.ok) {
    throw new Error(
      `VFX package ${entry.id} cannot be added: ${compilation.errors.map((item) => item.message).join(" ")}`
    );
  }
  const document = entry.archive.document;
  const targetObjectId = options.targetObjectId ?? document.target?.entityId ?? "";
  const legacy = {
    ...createEffectInstance("customVfx", {
      id: options.id,
      startFrame: options.startFrame,
      targetObjectId
    }),
    name: entry.archive.manifest.displayName,
    durationFrames: document.durationFrames
  };
  const projected = adaptLegacyEffectInstance(legacy);
  const keepDocumentBone =
    document.target?.boneId !== undefined &&
    targetObjectId === document.target.entityId;
  return synchronizeLegacyEffectNativeVfx(legacy, {
    ...projected,
    displayName: legacy.name,
    durationFrames: document.durationFrames,
    space: document.space,
    target: targetObjectId
      ? {
          entityId: targetObjectId,
          ...(keepDocumentBone ? { boneId: document.target?.boneId } : {})
        }
      : null,
    seed: document.seed,
    blendMode: document.blendMode,
    renderLayer: document.renderLayer,
    previewQuality: document.previewQuality,
    exportQuality: document.exportQuality,
    customRecipe: {
      version: VFX_CUSTOM_RECIPE_VERSION,
      source: {
        packageId: entry.id,
        packageVersion: entry.version,
        documentId: document.id
      },
      descriptors: structuredClone(compilation.value.descriptors)
    }
  });
}

export function getInstalledVfxSourceStatus(
  effect: EffectInstance,
  registry: VfxPackageRegistry
): InstalledVfxSourceStatus | null {
  const source = effect.nativeVfx?.customRecipe?.source;
  if (!source) return null;
  const entry = registry.packages.find((item) => item.id === source.packageId);
  if (!entry) return "missing";
  if (entry.version !== source.packageVersion) return "version-mismatch";
  return entry.enabled ? "available" : "disabled";
}
