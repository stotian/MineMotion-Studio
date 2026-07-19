import { describe, expect, it } from "vitest";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { prepareProjectVfxFrame } from "../runtime/VfxProjectFrame";
import { VFX_GLOBAL_FRAME_LIMITS } from "../runtime/VfxFrameBudget";
import { getVfxBenchmarkScene, listVfxBenchmarkScenes } from "./VfxBenchmarkScenes";

describe("VFX benchmark scenes", () => {
  it("provides deterministic canonical fixtures with stable IDs", () => {
    const scenes = listVfxBenchmarkScenes();
    expect(scenes.map((scene) => scene.id)).toEqual([
      "family-showcase",
      "dense-particles",
      "dense-segments",
      "dense-balanced"
    ]);
    expect(getVfxBenchmarkScene("dense-segments")).toBe(scenes[2]);
    expect(getVfxBenchmarkScene("missing")).toBeNull();
    for (const scene of scenes) {
      expect(scene.createProject()).toEqual(scene.createProject());
    }
  });

  it("matches exact requested/allocation/limit regressions", () => {
    for (const scene of listVfxBenchmarkScenes()) {
      const prepared = prepareProjectVfxFrame(scene.createProject(), {
        frame: scene.frame,
        includeVfx: true,
        quality: "final"
      });
      expect(prepared.ok, scene.id).toBe(true);
      if (!prepared.ok) continue;
      expect(prepared.value.budget, scene.id).toEqual({
        limits: { ...VFX_GLOBAL_FRAME_LIMITS },
        ...scene.expected
      });
      expect(prepared.value.budget.allocated.effects).toBeLessThanOrEqual(VFX_GLOBAL_FRAME_LIMITS.effects);
      expect(prepared.value.budget.allocated.particles).toBeLessThanOrEqual(VFX_GLOBAL_FRAME_LIMITS.particles);
      expect(prepared.value.budget.allocated.segments).toBeLessThanOrEqual(VFX_GLOBAL_FRAME_LIMITS.segments);
      expect(prepared.value.budget.allocated.stackWork).toBeLessThanOrEqual(VFX_GLOBAL_FRAME_LIMITS.stackWork);
    }
  });

  it("preserves benchmark behavior through JSON and package round-trips", () => {
    for (const scene of listVfxBenchmarkScenes()) {
      const project = scene.createProject();
      const variants = [
        ProjectSerializer.parse(ProjectSerializer.serialize(project)),
        PackageReader.parse(JSON.stringify(createMineMotionPackageData(project)))
      ];
      for (const variant of variants) {
        const prepared = prepareProjectVfxFrame(variant, {
          frame: scene.frame,
          includeVfx: true,
          quality: "final"
        });
        expect(prepared.ok, scene.id).toBe(true);
        if (prepared.ok) expect(prepared.value.budget).toMatchObject(scene.expected);
      }
    }
  });
});
