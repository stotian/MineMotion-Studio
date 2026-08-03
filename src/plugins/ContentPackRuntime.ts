import type { PresetRegistry } from "../presets/PresetRegistry";
import type { TemplateRegistry } from "../templates/TemplateRegistry";
import { ProjectSerializer } from "../project/ProjectSerializer";
import type { SafeContentPack } from "./ExtensionTypes";

export interface ContentPackApplyResult {
  cameraPresets: number;
  templates: number;
  warnings: string[];
}

export function applySafeContentPack(
  pack: SafeContentPack,
  registries: { presets: PresetRegistry; templates: TemplateRegistry }
): ContentPackApplyResult {
  const warnings: string[] = [];
  for (const preset of pack.data.cameraPresets ?? []) registries.presets.registerCameraPreset(preset);
  for (const template of pack.data.templates ?? []) {
    try {
      const serialized = JSON.stringify(template.project);
      ProjectSerializer.parse(serialized);
      registries.templates.register({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        create: () => ProjectSerializer.parse(serialized)
      });
    } catch (error) { warnings.push(error instanceof Error ? error.message : "Template registration failed."); }
  }
  if ((pack.data.vfxPresets?.length ?? 0) > 0) warnings.push("VFX pack records are validated but require .minemotion-vfx installation for runtime compilation.");
  return { cameraPresets: pack.data.cameraPresets?.length ?? 0, templates: pack.data.templates?.length ?? 0, warnings };
}
