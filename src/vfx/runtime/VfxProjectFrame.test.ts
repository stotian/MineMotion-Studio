import { describe, expect, it } from "vitest";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { createInitialProject } from "../../project/ProjectStore";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { createFinalCameraFrame } from "../../rendering/export/FinalCameraRenderer";
import {
  getPreparedCameraShakeOffset,
  prepareProjectVfxFrame,
  resolveVfxAnimationSampleFrame,
  shouldIncludeProjectVfx
} from "./VfxProjectFrame";
import { VFX_GLOBAL_FRAME_LIMITS } from "./VfxFrameBudget";

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
      value: {
        frame: 15,
        fps: 24,
        included: false,
        effects: [],
        budget: {
          limits: { ...VFX_GLOBAL_FRAME_LIMITS },
          requested: { effects: 0, particles: 0, segments: 0, stackWork: 0 },
          allocated: { effects: 0, particles: 0, segments: 0, stackWork: 0 },
          droppedEffects: 0,
          limitHits: { effects: 0, particles: 0, segments: 0, stackWork: 0 }
        }
      },
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

  it("applies the global particle cap deterministically before rendering", () => {
    const project = createInitialProject();
    project.effects.instances = Array.from({ length: 6 }, (_, index) =>
      createEffectInstance("glowBurst", {
        id: `effect_budget_${index}`,
        startFrame: 0,
        parameters: { count: 1_024 }
      })
    );

    const first = prepareProjectVfxFrame(project, {
      frame: 0,
      includeVfx: true,
      quality: "final"
    });
    const second = prepareProjectVfxFrame(structuredClone(project), {
      frame: 0,
      includeVfx: true,
      quality: "final"
    });

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.effects).toHaveLength(4);
    expect(first.value.effects.map((effect) => effect.budget.particles)).toEqual([
      1_024,
      1_024,
      1_024,
      1_024
    ]);
    expect(first.value.budget.allocated.particles).toBe(4_096);
    expect(first.value.budget.requested.particles).toBe(6_144);
    expect(first.value.budget.droppedEffects).toBe(2);
    expect(first.warnings.map((warning) => warning.code)).toContain(
      "VFX_GLOBAL_PARTICLES_BUDGET_CAPPED"
    );
  });

  it("evaluates native combat recipes through the shared project budget", () => {
    const project = createInitialProject();
    project.effects.instances = [
      createEffectInstance("criticalHit", { id: "critical_native", startFrame: 0 })
    ];
    const prepared = prepareProjectVfxFrame(project, {
      frame: 4,
      includeVfx: true,
      quality: "final"
    });

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects[0].primitives.map((primitive) => primitive.kind)).toEqual([
      "particle-emitter",
      "expanding-ring",
      "light-pulse"
    ]);
    expect(prepared.value.budget.allocated).toMatchObject({
      effects: 1,
      particles: 54,
      segments: 96
    });
    const reloadedProjects = [
      ProjectSerializer.parse(ProjectSerializer.serialize(project)),
      PackageReader.parse(JSON.stringify(createMineMotionPackageData(project)))
    ];
    for (const reloaded of reloadedProjects) {
      expect(reloaded.effects.instances[0]).toMatchObject({
        type: "criticalHit",
        nativeVfx: { definitionId: "criticalHit", serializationVersion: 1 }
      });
    }
  });

  it("holds animation sampling at the hit-stop start while global frames continue", () => {
    const project = createInitialProject();
    project.effects.instances = [
      createEffectInstance("hitStop", { id: "hit_stop", startFrame: 12 })
    ];
    expect(resolveVfxAnimationSampleFrame(project, 11)).toBe(11);
    expect(resolveVfxAnimationSampleFrame(project, 12)).toBe(12);
    expect(resolveVfxAnimationSampleFrame(project, 14)).toBe(12);
    expect(resolveVfxAnimationSampleFrame(project, 16)).toBe(16);
    project.renderSettings.renderPreviewEnabled = true;
    project.exportSettings.includeVfx = false;
    expect(resolveVfxAnimationSampleFrame(project, 14)).toBe(14);
  });

  it("supports intentionally disabling a native particle burst with count zero", () => {
    const project = createInitialProject();
    project.effects.instances = [
      createEffectInstance("combatSparks", {
        id: "sparks_disabled",
        startFrame: 0,
        parameters: { count: 0 }
      })
    ];
    const prepared = prepareProjectVfxFrame(project, {
      frame: 1,
      includeVfx: true,
      quality: "final"
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects[0].primitives).toEqual([]);
    expect(prepared.value.effects[0].budget.particles).toBe(0);
  });

  it("evaluates the electric family through the same prepared-frame contract", () => {
    const project = createInitialProject();
    project.effects.instances = [
      createEffectInstance("electricStorm", {
        id: "electric_storm",
        startFrame: 0
      })
    ];
    const prepared = prepareProjectVfxFrame(project, {
      frame: 8,
      includeVfx: true,
      quality: "final"
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects[0].primitives).toHaveLength(3);
    expect(prepared.value.effects[0].primitives.every((primitive) => primitive.kind === "beam")).toBe(true);
    expect(prepared.value.effects[0].budget.segments).toBe(168);
  });

  it("drops dense electric storms deterministically at the shared segment cap", () => {
    const project = createInitialProject();
    project.effects.instances = Array.from({ length: 60 }, (_, index) =>
      createEffectInstance("electricStorm", {
        id: `electric_storm_${index}`,
        startFrame: 0
      })
    );
    const prepared = prepareProjectVfxFrame(project, {
      frame: 8,
      includeVfx: true,
      quality: "final"
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects).toHaveLength(48);
    expect(prepared.value.budget.allocated.segments).toBe(8_064);
    expect(prepared.value.budget.droppedEffects).toBe(12);
    expect(prepared.warnings.map((warning) => warning.code)).toContain(
      "VFX_GLOBAL_SEGMENTS_BUDGET_CAPPED"
    );
  });

  it("evaluates layered native explosions with measured particle and segment work", () => {
    const project = createInitialProject();
    project.effects.instances = [
      createEffectInstance("nativeExplosion", {
        id: "native_explosion",
        startFrame: 0
      })
    ];
    const prepared = prepareProjectVfxFrame(project, {
      frame: 4,
      includeVfx: true,
      quality: "final"
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects[0].primitives.map((primitive) => primitive.kind)).toEqual([
      "particle-emitter",
      "expanding-ring",
      "light-pulse"
    ]);
    expect(prepared.value.effects[0].budget).toMatchObject({
      particles: 64,
      segments: 112
    });
  });

  it("evaluates a native magic portal with concentric rings and sparks", () => {
    const project = createInitialProject();
    project.effects.instances = [
      createEffectInstance("magicPortal", {
        id: "magic_portal",
        startFrame: 0
      })
    ];
    const prepared = prepareProjectVfxFrame(project, {
      frame: 12,
      includeVfx: true,
      quality: "final"
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects[0].primitives.map((primitive) => primitive.kind)).toEqual([
      "expanding-ring",
      "expanding-ring",
      "particle-emitter"
    ]);
    expect(prepared.value.effects[0].budget).toMatchObject({
      particles: 44,
      segments: 160
    });
  });

  it("prepares a mixed native environment storm within shared budgets", () => {
    const project = createInitialProject();
    project.effects.instances = [
      createEffectInstance("environmentStorm", {
        id: "environment_storm",
        startFrame: 0
      })
    ];
    const prepared = prepareProjectVfxFrame(project, {
      frame: 20,
      includeVfx: true,
      quality: "final"
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects[0].primitives.map((primitive) => primitive.kind)).toEqual([
      "particle-emitter",
      "beam",
      "beam"
    ]);
    expect(prepared.value.effects[0].budget).toMatchObject({
      particles: 128,
      segments: 96
    });
  });

  it("prepares the native screen family and applies shake/freeze timing", () => {
    const project = createInitialProject();
    const types = [
      "nativeScreenFlash",
      "nativeScreenShake",
      "screenGlitch",
      "cinematicFrameBars",
      "screenBloom",
      "nativeVignette",
      "cinematicFreeze",
      "colorDrain"
    ] as const;
    project.effects.instances = types.map((type, index) =>
      createEffectInstance(type, {
        id: `screen_${index}`,
        startFrame: 10
      })
    );
    const prepared = prepareProjectVfxFrame(project, {
      frame: 12,
      includeVfx: true,
      quality: "final"
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.effects).toHaveLength(8);
    expect(prepared.value.effects.every((effect) => effect.primitives[0]?.kind === "light-pulse")).toBe(true);
    expect(getPreparedCameraShakeOffset(prepared.value.effects)).not.toEqual({ x: 0, y: 0 });
    expect(resolveVfxAnimationSampleFrame(project, 14)).toBe(10);
    project.renderSettings.renderPreviewEnabled = true;
    project.exportSettings.includeVfx = false;
    expect(resolveVfxAnimationSampleFrame(project, 14)).toBe(14);
  });
});
