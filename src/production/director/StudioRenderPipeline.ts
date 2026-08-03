import { enqueueRenderJob } from "../../export/renderQueue/RenderQueue";
import type { RenderJob, RenderQueueState } from "../../export/renderQueue/RenderJob";
import type { ExportQuality, ExportRenderPass } from "../../export/ExportTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createShotRenderJobs } from "../ShotHandoff";
import type { ProductionShot } from "../ShotTypes";

export const STUDIO_RENDER_PROFILES = ["preview", "final", "compositing"] as const;
export type StudioRenderProfile = (typeof STUDIO_RENDER_PROFILES)[number];

export const STUDIO_RENDER_SCOPES = ["selected", "approved", "active"] as const;
export type StudioRenderScope = (typeof STUDIO_RENDER_SCOPES)[number];

export interface StudioRenderPlan {
  profile: StudioRenderProfile;
  scope: StudioRenderScope;
  shotIds: string[];
  jobs: RenderJob[];
  estimatedFrames: number;
  estimatedPixelSamples: number;
  skippedShotIds: string[];
}

export interface StudioQueueEstimate {
  jobs: number;
  frames: number;
  pixelSamples: number;
  durationSeconds: number;
  estimatedRawBytes: number;
}

export interface StudioRenderMutation {
  project: MineMotionProject;
  changed: boolean;
  affectedJobIds: string[];
  message: string;
}

export function buildStudioRenderPlan(
  project: MineMotionProject,
  profile: StudioRenderProfile,
  scope: StudioRenderScope = "approved"
): StudioRenderPlan {
  const selected = selectShots(project, scope);
  const skippedShotIds: string[] = [];
  const jobs = selected.flatMap((shot) => {
    if (!shot.enabled || shot.rejected || !shot.cameraId || shot.endFrame < shot.startFrame) {
      skippedShotIds.push(shot.id);
      return [];
    }
    return configureJobsForProfile(createShotRenderJobs(project, shot), profile, shot);
  });
  const estimate = estimateJobs(jobs);
  return {
    profile,
    scope,
    shotIds: selected.filter((shot) => !skippedShotIds.includes(shot.id)).map((shot) => shot.id),
    jobs,
    estimatedFrames: estimate.frames,
    estimatedPixelSamples: estimate.pixelSamples,
    skippedShotIds
  };
}

export function enqueueStudioRenderPlan(
  project: MineMotionProject,
  plan: StudioRenderPlan
): StudioRenderMutation {
  const existingKeys = new Set(project.renderQueue.jobs.map(renderJobIdentity));
  const uniqueJobs = plan.jobs.filter((job) => {
    const key = renderJobIdentity(job);
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });
  if (uniqueJobs.length === 0) {
    return { project, changed: false, affectedJobIds: [], message: "No new production render jobs were added." };
  }
  const renderQueue = uniqueJobs.reduce(enqueueRenderJob, project.renderQueue);
  return {
    project: { ...project, renderQueue },
    changed: true,
    affectedJobIds: uniqueJobs.map((job) => job.id),
    message: `Queued ${uniqueJobs.length} production render job(s).`
  };
}

export function queueStudioRenders(
  project: MineMotionProject,
  profile: StudioRenderProfile,
  scope: StudioRenderScope = "approved"
): StudioRenderMutation {
  return enqueueStudioRenderPlan(project, buildStudioRenderPlan(project, profile, scope));
}

export function deduplicateProductionRenderQueue(project: MineMotionProject): StudioRenderMutation {
  const seen = new Set<string>();
  const removed: string[] = [];
  const jobs = project.renderQueue.jobs.filter((job) => {
    if (job.status === "running") return true;
    const key = renderJobIdentity(job);
    if (seen.has(key)) {
      removed.push(job.id);
      return false;
    }
    seen.add(key);
    return true;
  });
  return replaceQueue(project, jobs, removed, "Removed duplicate production render jobs.");
}

export function sortProductionRenderQueue(project: MineMotionProject): StudioRenderMutation {
  const order = new Map(
    [...project.production.shots]
      .sort((a, b) => a.startFrame - b.startFrame || a.takeNumber - b.takeNumber || a.revision - b.revision)
      .map((shot, index) => [shot.id, index])
  );
  const jobs = [...project.renderQueue.jobs].sort((a, b) => {
    const aOrder = a.production ? order.get(a.production.shotId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const bOrder = b.production ? order.get(b.production.shotId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return passOrder(a.settings.renderPass) - passOrder(b.settings.renderPass) || a.createdAt.localeCompare(b.createdAt);
  });
  const changed = jobs.some((job, index) => job.id !== project.renderQueue.jobs[index]?.id);
  return {
    project: changed ? { ...project, renderQueue: { ...project.renderQueue, jobs } } : project,
    changed,
    affectedJobIds: changed ? jobs.map((job) => job.id) : [],
    message: changed ? "Sorted production render jobs by shot and pass." : "Render queue is already ordered."
  };
}

export function prioritizeActiveShotRenderJobs(project: MineMotionProject): StudioRenderMutation {
  const activeShotId = project.production.activeShotId;
  if (!activeShotId) return { project, changed: false, affectedJobIds: [], message: "No active production shot." };
  const movable = project.renderQueue.jobs.filter((job) => job.status !== "running");
  const running = project.renderQueue.jobs.filter((job) => job.status === "running");
  const priority = movable.filter((job) => job.production?.shotId === activeShotId);
  const rest = movable.filter((job) => job.production?.shotId !== activeShotId);
  if (priority.length === 0) return { project, changed: false, affectedJobIds: [], message: "The active shot has no queued render jobs." };
  const jobs = [...running, ...priority, ...rest];
  const changed = jobs.some((job, index) => job.id !== project.renderQueue.jobs[index]?.id);
  return {
    project: changed ? { ...project, renderQueue: { ...project.renderQueue, jobs } } : project,
    changed,
    affectedJobIds: priority.map((job) => job.id),
    message: changed ? "Prioritized active-shot render jobs." : "Active-shot jobs are already prioritized."
  };
}

export function retryFailedProductionJobs(project: MineMotionProject): StudioRenderMutation {
  const now = new Date().toISOString();
  const affected: string[] = [];
  const jobs = project.renderQueue.jobs.map((job) => {
    if (!job.production || (job.status !== "error" && job.status !== "cancelled")) return job;
    affected.push(job.id);
    return { ...job, status: "queued" as const, progress: 0, message: "Waiting in render queue.", error: "", outputPath: "", updatedAt: now };
  });
  return replaceQueue(project, jobs, affected, "Requeued failed production render jobs.");
}

export function cancelQueuedProductionJobs(project: MineMotionProject): StudioRenderMutation {
  const now = new Date().toISOString();
  const affected: string[] = [];
  const jobs = project.renderQueue.jobs.map((job) => {
    if (!job.production || job.status !== "queued") return job;
    affected.push(job.id);
    return { ...job, status: "cancelled" as const, message: "Cancelled before rendering.", updatedAt: now };
  });
  return replaceQueue(project, jobs, affected, "Cancelled queued production render jobs.");
}

export function removeStaleProductionJobs(project: MineMotionProject): StudioRenderMutation {
  const shots = new Map(project.production.shots.map((shot) => [shot.id, shot]));
  const removed: string[] = [];
  const jobs = project.renderQueue.jobs.filter((job) => {
    if (!job.production || job.status === "running") return true;
    const shot = shots.get(job.production.shotId);
    const stale = !shot || shot.revision !== job.production.revision || shot.takeNumber !== job.production.takeNumber;
    if (stale) removed.push(job.id);
    return !stale;
  });
  return replaceQueue(project, jobs, removed, "Removed stale production render jobs.");
}

export function synchronizeQueuedJobsToShots(project: MineMotionProject): StudioRenderMutation {
  const shots = new Map(project.production.shots.map((shot) => [shot.id, shot]));
  const affected: string[] = [];
  const jobs = project.renderQueue.jobs.map((job) => {
    const shot = job.production ? shots.get(job.production.shotId) : undefined;
    if (!shot || job.status === "running" || job.status === "complete") return job;
    const configured = configureJobForShot(job, shot);
    const changed = renderJobIdentity(configured) !== renderJobIdentity(job) ||
      configured.settings.startFrame !== job.settings.startFrame ||
      configured.settings.endFrame !== job.settings.endFrame ||
      configured.settings.cameraId !== job.settings.cameraId;
    if (changed) affected.push(job.id);
    return changed ? configured : job;
  });
  return replaceQueue(project, jobs, affected, "Synchronized queued jobs with current shot settings.");
}

export function estimateProductionRenderQueue(queue: RenderQueueState): StudioQueueEstimate {
  return estimateJobs(queue.jobs.filter((job) => job.status === "queued" || job.status === "running"));
}

export function createStudioRenderQueueManifest(project: MineMotionProject): string {
  const estimate = estimateProductionRenderQueue(project.renderQueue);
  return JSON.stringify({
    schemaVersion: 1,
    projectName: project.projectName,
    generatedAt: new Date().toISOString(),
    estimate,
    jobs: project.renderQueue.jobs.map((job, index) => ({
      queueIndex: index,
      id: job.id,
      name: job.name,
      status: job.status,
      shotId: job.production?.shotId ?? null,
      takeGroupId: job.production?.takeGroupId ?? null,
      takeNumber: job.production?.takeNumber ?? null,
      revision: job.production?.revision ?? null,
      renderPass: job.settings.renderPass,
      frameRange: [job.settings.startFrame, job.settings.endFrame],
      resolution: [job.settings.width, job.settings.height],
      fps: job.settings.fps,
      format: job.settings.format,
      quality: job.settings.quality,
      cameraId: job.settings.cameraId,
      outputName: job.settings.outputName,
      outputFolder: job.production?.outputFolder ?? ""
    }))
  }, null, 2);
}

function selectShots(project: MineMotionProject, scope: StudioRenderScope): ProductionShot[] {
  if (scope === "selected") {
    const selected = project.production.shots.find((shot) => shot.id === project.production.activeShotId);
    return selected ? [selected] : [];
  }
  const active = project.production.shots.filter((shot) => shot.enabled && shot.activeTake && !shot.rejected);
  if (scope === "active") return active;
  return active.filter((shot) => shot.approved || shot.status === "approved" || shot.status === "final");
}

function configureJobsForProfile(jobs: RenderJob[], profile: StudioRenderProfile, shot: ProductionShot): RenderJob[] {
  if (profile === "preview") {
    const beauty = jobs.find((job) => job.settings.renderPass === "beauty") ?? jobs[0];
    return beauty ? [applyProfileToJob(beauty, profile, shot)] : [];
  }
  if (profile === "compositing") {
    const allowed = new Set<ExportRenderPass>(["beauty", "alpha", "world", "characters", "vfx", "depth", "normals", "object-id"]);
    return jobs.filter((job) => allowed.has(job.settings.renderPass)).map((job) => applyProfileToJob(job, profile, shot));
  }
  return jobs.map((job) => applyProfileToJob(job, profile, shot));
}

function applyProfileToJob(job: RenderJob, profile: StudioRenderProfile, shot: ProductionShot): RenderJob {
  const profileSettings: Record<StudioRenderProfile, {
    width: number;
    height: number;
    quality: ExportQuality;
    format: RenderJob["settings"]["format"];
    includeAudio: boolean;
  }> = {
    preview: { width: 960, height: 540, quality: "draft", format: "webm_video", includeAudio: true },
    final: { width: shot.renderPreset.width, height: shot.renderPreset.height, quality: "high", format: "png_sequence", includeAudio: job.settings.renderPass === "beauty" },
    compositing: { width: shot.renderPreset.width, height: shot.renderPreset.height, quality: "high", format: "png_sequence", includeAudio: false }
  };
  const settings = profileSettings[profile];
  const suffix = profile === "preview" ? "preview" : profile === "final" ? "final" : "comp";
  return {
    ...job,
    name: `${shot.name} / ${job.settings.renderPass} / ${suffix}`,
    settings: {
      ...job.settings,
      width: settings.width,
      height: settings.height,
      quality: settings.quality,
      format: settings.format,
      includeAudio: settings.includeAudio,
      includeCinematicBars: profile !== "compositing" && job.settings.renderPass === "beauty",
      outputName: `${job.settings.outputName}_${suffix}`
    }
  };
}

function configureJobForShot(job: RenderJob, shot: ProductionShot): RenderJob {
  return {
    ...job,
    name: `${shot.name} / ${job.settings.renderPass}`,
    settings: {
      ...job.settings,
      startFrame: shot.startFrame,
      endFrame: shot.endFrame,
      fps: shot.renderPreset.fps,
      cameraId: shot.cameraId,
      postProcessingOverride: shot.postProcessingOverride,
      outputName: job.settings.outputName.replace(/^[^_]+/, shot.outputName || shot.name)
    },
    production: job.production ? {
      ...job.production,
      takeGroupId: shot.takeGroupId,
      takeNumber: shot.takeNumber,
      revision: shot.revision,
      outputFolder: shot.outputFolder
    } : undefined,
    updatedAt: new Date().toISOString()
  };
}

function estimateJobs(jobs: RenderJob[]): StudioQueueEstimate {
  const totals = jobs.reduce((result, job) => {
    const frames = Math.max(1, job.settings.endFrame - job.settings.startFrame + 1);
    const pixels = Math.max(1, job.settings.width) * Math.max(1, job.settings.height);
    result.frames += frames;
    result.pixelSamples += frames * pixels;
    result.durationSeconds += frames / Math.max(1, job.settings.fps);
    result.estimatedRawBytes += frames * pixels * 4;
    return result;
  }, { jobs: jobs.length, frames: 0, pixelSamples: 0, durationSeconds: 0, estimatedRawBytes: 0 });
  return totals;
}

function renderJobIdentity(job: RenderJob): string {
  if (!job.production) return `generic:${job.id}`;
  return [
    job.production.shotId,
    job.production.takeNumber,
    job.production.revision,
    job.settings.renderPass,
    job.settings.format,
    job.settings.width,
    job.settings.height,
    job.settings.startFrame,
    job.settings.endFrame,
    job.settings.cameraId,
    job.settings.outputName
  ].join(":");
}

function passOrder(pass: ExportRenderPass): number {
  return ["beauty", "alpha", "world", "characters", "vfx", "depth", "normals", "object-id"].indexOf(pass);
}

function replaceQueue(
  project: MineMotionProject,
  jobs: RenderJob[],
  affectedJobIds: string[],
  successMessage: string
): StudioRenderMutation {
  if (affectedJobIds.length === 0) {
    return { project, changed: false, affectedJobIds: [], message: "No production render jobs changed." };
  }
  const activeJobId = jobs.some((job) => job.id === project.renderQueue.activeJobId)
    ? project.renderQueue.activeJobId
    : null;
  return {
    project: { ...project, renderQueue: { ...project.renderQueue, jobs, activeJobId } },
    changed: true,
    affectedJobIds,
    message: successMessage
  };
}
