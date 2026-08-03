import { describe, expect, it, vi } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import { createDefaultExportSettings, withExportSettingsDefaults } from "../export/ExportSettings";
import { createPostProcessingPlan } from "./postprocessing/PostProcessingPlan";
import { createRenderPassMetadata } from "./export/RenderPassMetadata";
import { RenderTargetPool } from "./RenderTargetPool";
import { createProductionShot } from "../production/ShotManager";
import { createShotRenderJobs } from "../production/ShotHandoff";
import { REAL_RENDER_PASSES } from "../production/ShotTypes";

describe("phase 29 compositing", () => {
  it("builds one canonical post plan for preview and offline rendering", () => {
    const project = createInitialProject();
    const finalPlan = createPostProcessingPlan(project.postProcessing, "final");
    const draftPlan = createPostProcessingPlan(project.postProcessing, "draft");
    expect(finalPlan.operations.map((operation) => operation.id)).toEqual(draftPlan.operations.map((operation) => operation.id));
    expect(finalPlan.cssFilter).toBe(draftPlan.cssFilter);
  });

  it("supports aligned beauty, alpha, world, characters, VFX, depth, normals and ID outputs", () => {
    const project = createInitialProject();
    const shot = createProductionShot(project, { renderPasses: [...REAL_RENDER_PASSES] });
    const jobs = createShotRenderJobs(project, shot);
    expect(jobs.map((job) => job.settings.renderPass)).toEqual([...REAL_RENDER_PASSES]);
    const normals = withExportSettingsDefaults({ ...createDefaultExportSettings(project), renderPass: "normals" });
    expect(createRenderPassMetadata(project, normals).colorSpace).toBe("linear-data");
    const ids = createRenderPassMetadata(project, { ...normals, renderPass: "object-id" });
    expect(ids.objectIds?.[project.activeCameraId]).toBeTruthy();
  });

  it("reuses and disposes bounded render targets", () => {
    const dispose = vi.fn();
    const pool = new RenderTargetPool({ create: (width, height) => ({ width, height, dispose }) }, 1);
    const first = pool.acquire(1920, 1080); pool.release(first);
    expect(pool.acquire(1920, 1080)).toBe(first);
    pool.dispose();
    expect(dispose).toHaveBeenCalled();
  });

  it("persists a per-shot post override into render jobs", () => {
    const project = createInitialProject();
    const shot = createProductionShot(project, { postProcessingOverride: { ...project.postProcessing, exposure: 1.5 } });
    expect(createShotRenderJobs(project, shot)[0].settings.postProcessingOverride?.exposure).toBe(1.5);
  });
});
