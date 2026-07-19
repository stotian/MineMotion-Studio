import { describe, expect, it } from "vitest";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { createInitialProject } from "../../project/ProjectStore";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createFinalCameraFrame } from "../../rendering/export/FinalCameraRenderer";
import {
  prepareProjectVfxFrame,
  shouldIncludeProjectVfx
} from "./VfxProjectFrame";

function createProject() {
  const project = createInitialProject();
  project.effects.instances = [
    createEffectInstance("shockwave", {
      id: "effect_prepared",
      startFrame: 10,
      targetObjectId: project.scene.characters[0].id,
      parameters: { radius: 7 }
    })
  ];
  return ProjectSerializer.parse(ProjectSerializer.serialize(project));
}

describe("prepareProjectVfxFrame", () => {
  it("prepares active schema 10 native VFX deterministically", () => {
    const project = createProject();
    const first = prepareProjectVfxFrame(project, {
      frame: 15,
      includeVfx: true,
      quality: "high"
    });
    const second = prepareProjectVfxFrame(structuredClone(project), {
      frame: 15,
      includeVfx: true,
      quality: "high"
    });

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.effects[0]).toMatchObject({
      type: "shockwave",
      resolvedTarget: {
        entityId: project.scene.characters[0].id,
        entityType: "character"
      },
      evaluation: {
        status: "active",
        localFrame: 5,
        inputs: { parameters: { radius: 7 } }
      }
    });
  });

  it("short-circuits every VFX layer when inclusion is disabled", () => {
    const project = createProject();
    const native = project.effects.instances[0].nativeVfx;
    if (!native) throw new Error("native VFX fixture missing");
    native.serializationVersion = 2 as 1;

    const result = prepareProjectVfxFrame(project, {
      frame: 15,
      includeVfx: false,
      quality: "export"
    });

    expect(result).toEqual({
      ok: true,
      value: { frame: 15, fps: 24, included: false, effects: [] },
      warnings: []
    });
  });

  it("excludes VFX from a final render frame when export settings disable it", () => {
    const project = createProject();
    expect(shouldIncludeProjectVfx(project)).toBe(true);
    const finalFrame = createFinalCameraFrame(
      project,
      { ...project.exportSettings, includeVfx: false },
      15
    );
    const prepared = prepareProjectVfxFrame(finalFrame, {
      includeVfx: shouldIncludeProjectVfx(finalFrame),
      quality: "export"
    });

    expect(shouldIncludeProjectVfx(finalFrame)).toBe(false);
    expect(prepared.ok && prepared.value.effects).toEqual([]);
  });

  it("uses persisted preview/export qualities and reports missing targets", () => {
    const project = createProject();
    const native = project.effects.instances[0].nativeVfx;
    if (!native) throw new Error("native VFX fixture missing");
    native.previewQuality = "draft";
    native.exportQuality = "final";
    project.effects.instances[0].targetObjectId = "missing_entity";
    native.target = { entityId: "missing_entity" };

    const preview = prepareProjectVfxFrame(project, {
      frame: 15,
      includeVfx: true,
      quality: "preview"
    });
    const exported = prepareProjectVfxFrame(project, {
      frame: 15,
      includeVfx: true,
      quality: "export"
    });

    expect(preview.ok && preview.value.effects[0].evaluation.quality).toBe("draft");
    expect(exported.ok && exported.value.effects[0].evaluation.quality).toBe("final");
    expect(exported.warnings.map((warning) => warning.code)).toContain(
      "VFX_TARGET_ENTITY_MISSING"
    );
  });

  it("returns structured failures for corrupt included native data", () => {
    const project = createProject();
    const native = project.effects.instances[0].nativeVfx;
    if (!native) throw new Error("native VFX fixture missing");
    native.serializationVersion = 2 as 1;

    const result = prepareProjectVfxFrame(project, {
      frame: 15,
      includeVfx: true,
      quality: "preview"
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toContain(
      "VFX_PROJECT_PREPARATION_FAILED"
    );
  });
});
