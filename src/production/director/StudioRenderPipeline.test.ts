import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { createProductionShot } from "../ShotManager";
import { prepareDialogueSequence } from "./DialogueDirector";
import { buildDirectorSequence } from "./DirectorSequenceBuilder";
import {
  buildStudioRenderPlan,
  createStudioRenderQueueManifest,
  deduplicateProductionRenderQueue,
  enqueueStudioRenderPlan,
  estimateProductionRenderQueue,
  removeStaleProductionJobs,
  synchronizeQueuedJobsToShots
} from "./StudioRenderPipeline";

describe("StudioRenderPipeline", () => {
  it("builds deterministic preview and final plans for approved active takes", () => {
    const initial = createInitialProject();
    const actor = initial.scene.characters[0];
    const prepared = prepareDialogueSequence(initial, {
      firstCharacterId: actor.id,
      secondCharacterId: actor.id,
      startFrame: 0,
      secondsPerShot: 1,
      stageActors: false
    });
    const directed = buildDirectorSequence(prepared.project, prepared.blueprint).project;
    const approved = {
      ...directed,
      production: {
        ...directed.production,
        shots: directed.production.shots.map((shot) => ({
          ...shot,
          approved: true,
          status: "approved" as const,
          renderPasses: ["beauty", "characters", "vfx"] as const
        }))
      }
    };

    const preview = buildStudioRenderPlan(approved, "preview", "approved");
    const final = buildStudioRenderPlan(approved, "final", "approved");

    expect(preview.jobs).toHaveLength(approved.production.shots.length);
    expect(preview.jobs.every((job) => job.settings.format === "webm_video")).toBe(true);
    expect(final.jobs).toHaveLength(approved.production.shots.length * 3);
    expect(final.jobs.every((job) => job.production?.shotId)).toBe(true);
  });

  it("deduplicates, estimates, manifests and synchronizes production jobs", () => {
    const initial = createInitialProject();
    const shot = createProductionShot(initial, {
      id: "shot_pipeline",
      takeGroupId: "take_pipeline",
      name: "SH010",
      startFrame: 0,
      endFrame: 23,
      cameraId: initial.scene.cameras[0].id,
      approved: true,
      activeTake: true,
      enabled: true,
      rejected: false,
      revision: 1,
      takeNumber: 1,
      renderPasses: ["beauty"]
    });
    const project = {
      ...initial,
      production: { ...initial.production, shots: [shot], activeShotId: shot.id }
    };
    const plan = buildStudioRenderPlan(project, "final", "approved");
    const queued = enqueueStudioRenderPlan(project, plan).project;
    const duplicate = {
      ...queued,
      renderQueue: {
        ...queued.renderQueue,
        jobs: [...queued.renderQueue.jobs, { ...queued.renderQueue.jobs[0], id: "duplicate" }]
      }
    };

    const clean = deduplicateProductionRenderQueue(duplicate).project;
    const estimate = estimateProductionRenderQueue(clean.renderQueue);
    const manifest = JSON.parse(createStudioRenderQueueManifest(clean)) as { jobs: unknown[] };

    expect(clean.renderQueue.jobs).toHaveLength(1);
    expect(estimate.frames).toBe(24);
    expect(manifest.jobs).toHaveLength(1);

    const edited = {
      ...clean,
      production: {
        ...clean.production,
        shots: clean.production.shots.map((candidate) => ({ ...candidate, startFrame: 10, endFrame: 40 }))
      }
    };
    const synchronized = synchronizeQueuedJobsToShots(edited).project;
    expect(synchronized.renderQueue.jobs[0].settings.startFrame).toBe(10);
    expect(synchronized.renderQueue.jobs[0].settings.endFrame).toBe(40);

    const revised = {
      ...synchronized,
      production: {
        ...synchronized.production,
        shots: synchronized.production.shots.map((candidate) => ({ ...candidate, revision: 2 }))
      }
    };
    expect(removeStaleProductionJobs(revised).project.renderQueue.jobs).toEqual([]);
  });
});
