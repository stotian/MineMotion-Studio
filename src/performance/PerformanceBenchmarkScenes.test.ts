import { describe, expect, it } from "vitest";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { prepareProjectVfxFrame } from "../vfx/runtime/VfxProjectFrame";
import { EMPTY_RENDERER_CULLING_SUMMARY } from "../renderer/RendererCulling";
import { EMPTY_RENDER_STATS } from "./RenderStats";
import { collectProjectComplexityMetrics } from "./RendererMetrics";
import { evaluatePerformanceBudget } from "./PerformanceBudgets";
import {
  getPerformanceBenchmarkScene,
  listPerformanceBenchmarkScenes,
  PERFORMANCE_BENCHMARK_IDS
} from "./PerformanceBenchmarkScenes";

describe("performance benchmark scenes", () => {
  it("provides the five required deterministic scene fixtures", () => {
    const scenes = listPerformanceBenchmarkScenes();
    expect(scenes.map((scene) => scene.id)).toEqual(PERFORMANCE_BENCHMARK_IDS);
    expect(getPerformanceBenchmarkScene("storm")).toBe(scenes[4]);
    expect(getPerformanceBenchmarkScene("missing")).toBeNull();
    for (const scene of scenes) {
      expect(scene.createProject()).toEqual(scene.createProject());
      expect(Object.isFrozen(scene)).toBe(true);
    }
  });

  it("matches stable project-complexity and Draft budget classifications", () => {
    for (const scene of listPerformanceBenchmarkScenes()) {
      const project = scene.createProject();
      const complexity = collectProjectComplexityMetrics(
        project,
        scene.sceneObjectEstimate,
        scene.expected.project.activeEffects
      );
      expect(complexity, scene.id).toEqual(scene.expected.project);
      const evaluation = evaluatePerformanceBudget({
        startupMs: 100,
        elapsedMs: 1_000,
        frame: {
          ...EMPTY_RENDER_STATS,
          fps: 60,
          bestFrameMs: 15,
          averageFrameMs: 16,
          p95FrameMs: 16.5,
          worstFrameMs: 18,
          samples: 120
        },
        renderer: {
          calls: 100,
          triangles: 100_000,
          points: 0,
          lines: 0,
          geometries: 100,
          textures: 20,
          programs: 5
        },
        heap: null,
        project: complexity,
        culling: EMPTY_RENDERER_CULLING_SUMMARY
      }, "draft");
      expect(evaluation.status, scene.id).toBe(scene.expected.draftBudgetStatus);
    }
  });

  it("retains known VFX allocation behavior and survives JSON round-trips", () => {
    for (const scene of listPerformanceBenchmarkScenes()) {
      const project = scene.createProject();
      const reopened = ProjectSerializer.parse(ProjectSerializer.serialize(project));
      expect(reopened, scene.id).toEqual(project);
      const prepared = prepareProjectVfxFrame(reopened, {
        frame: scene.frame,
        includeVfx: true,
        quality: "final"
      });
      expect(prepared.ok, scene.id).toBe(true);
      if (!prepared.ok) continue;
      if (scene.expected.vfx) {
        expect(prepared.value.budget, scene.id).toMatchObject(scene.expected.vfx);
      } else {
        expect(prepared.value.effects, scene.id).toEqual([]);
      }
    }
  });
});
