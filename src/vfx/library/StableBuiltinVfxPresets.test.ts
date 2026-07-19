import { describe, expect, it } from "vitest";
import { applyEffectTimelineCommand } from "../../effects/EffectTimelineController";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { createInitialProject } from "../../project/ProjectStore";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { prepareProjectVfxFrame } from "../runtime/VfxProjectFrame";
import { builtinVfxPresetCatalog } from "./BuiltinVfxPresetCatalog";

describe("stable built-in VFX presets", () => {
  const stable = builtinVfxPresetCatalog.list().filter(
    (preset) => preset.metadata.compatibility.maturity === "stable"
  );

  it("inserts and preserves all 60 stable presets through JSON and package persistence", () => {
    let project = createInitialProject();
    for (const preset of stable) {
      const result = applyEffectTimelineCommand(project, {
        type: "insert",
        effect: createEffectInstance(preset.metadata.effectType, {
          id: `stable_${preset.metadata.id}`,
          startFrame: 0
        })
      });
      expect(result.ok, preset.metadata.id).toBe(true);
      if (result.ok) project = result.value.project;
    }
    expect(project.effects.instances).toHaveLength(60);
    const json = ProjectSerializer.parse(ProjectSerializer.serialize(project));
    const packaged = PackageReader.parse(JSON.stringify(createMineMotionPackageData(project)));
    for (const reloaded of [json, packaged]) {
      expect(reloaded.effects.instances.map((effect) => effect.type)).toEqual(
        stable.map((preset) => preset.metadata.effectType)
      );
      expect(reloaded.effects.instances.every((effect) => effect.nativeVfx !== undefined)).toBe(true);
    }
  });

  it("prepares preview/export and degrades missing targets safely for every stable preset", () => {
    for (const preset of stable) {
      const project = createInitialProject();
      const effect = createEffectInstance(preset.metadata.effectType, {
        id: `verify_${preset.metadata.id}`,
        startFrame: 0,
        targetObjectId: "missing_preview_target"
      });
      project.effects.instances = [effect];
      const frame = Math.floor(effect.durationFrames * 0.4);
      const preview = prepareProjectVfxFrame(project, {
        frame,
        includeVfx: true,
        quality: "preview"
      });
      const exported = prepareProjectVfxFrame(project, {
        frame,
        includeVfx: true,
        quality: "export"
      });
      expect(preview.ok, `${preset.metadata.id} preview`).toBe(true);
      expect(exported.ok, `${preset.metadata.id} export`).toBe(true);
      expect(preview.warnings.map((warning) => warning.code)).toContain(
        "VFX_TARGET_ENTITY_MISSING"
      );
      if (preview.ok && exported.ok) {
        expect(preview.value.effects).toHaveLength(1);
        expect(exported.value.effects).toHaveLength(1);
        expect(exported.value.effects[0].type).toBe(preset.metadata.effectType);
      }
    }
  });
});
