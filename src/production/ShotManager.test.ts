import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import { createProductionShot, duplicateShotAsTake, setActiveTake } from "./ShotManager";
import { createShotHandoffManifest, createShotRenderJobs } from "./ShotHandoff";
import { validateProductionShot } from "./ShotValidation";
import { sanitizeRenderQueue } from "../export/renderQueue/RenderQueueStore";
import { ProjectSerializer } from "../project/ProjectSerializer";

describe("shot production workflow", () => {
  it("duplicates takes without deleting the previous revision", () => {
    const project = createInitialProject();
    const shot = createProductionShot(project, { name: "SH010" });
    const duplicated = duplicateShotAsTake({ ...project.production, shots: [shot], activeShotId: shot.id }, shot.id);
    expect(duplicated.shots).toHaveLength(2);
    expect(duplicated.shots[0].activeTake).toBe(false);
    expect(duplicated.shots[1].takeNumber).toBe(2);
    expect(setActiveTake(duplicated, shot.id).shots[0].activeTake).toBe(true);
  });

  it("creates deterministic handoff folders and real pass jobs", () => {
    const project = createInitialProject();
    const shot = createProductionShot(project, { name: "SH010", renderPasses: ["beauty", "world", "vfx"] });
    const manifest = createShotHandoffManifest(project, shot);
    const jobs = createShotRenderJobs(project, shot);
    expect(manifest.output.passes.map((pass) => pass.id)).toEqual(["beauty", "world", "vfx"]);
    expect(jobs.map((job) => job.settings.renderPass)).toEqual(["beauty", "world", "vfx"]);
    expect(jobs[0].production?.shotId).toBe(shot.id);
  });

  it("validates camera, frame range and disk estimates", () => {
    const project = createInitialProject();
    const shot = createProductionShot(project, { name: "SH010" });
    const result = validateProductionShot(project, shot, { projectSaved: true, availableDiskBytes: Number.MAX_SAFE_INTEGER });
    expect(result.valid).toBe(true);
  });
  it("migrates old projects and recovers interrupted queue jobs", () => {
    const project = createInitialProject();
    const legacy = JSON.parse(ProjectSerializer.serialize(project));
    delete legacy.production;
    expect(ProjectSerializer.parse(JSON.stringify(legacy)).production.shots).toEqual([]);
    const shot = createProductionShot(project, { name: "SH010" });
    const [job] = createShotRenderJobs(project, shot);
    const recovered = sanitizeRenderQueue({ jobs: [{ ...job, status: "running", progress: 0.5 }], activeJobId: job.id, historyLimit: 30 });
    expect(recovered.activeJobId).toBeNull();
    expect(recovered.jobs[0].status).toBe("queued");
  });

});
