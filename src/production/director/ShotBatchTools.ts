import type { MineMotionProject } from "../../project/ProjectFile";
import type { RenderPassId, ShotStatus } from "../ShotTypes";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";

export interface ShotBatchResult {
  project: MineMotionProject;
  changed: boolean;
  affectedShotIds: string[];
  error: string | null;
}

export function sortShotsChronologically(project: MineMotionProject): ShotBatchResult {
  const shots = [...project.production.shots].sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame || a.name.localeCompare(b.name));
  return complete(project, shots, shots.map((shot) => shot.id));
}

export function renameShotsSequentially(project: MineMotionProject, prefix = "SH", step = 10): ShotBatchResult {
  const safePrefix = prefix.trim().replace(/[^a-z0-9_-]+/gi, "").slice(0, 12) || "SH";
  const increment = Math.max(1, Math.min(100, Math.round(step)));
  const ordered = [...project.production.shots].sort((a, b) => a.startFrame - b.startFrame || a.takeNumber - b.takeNumber);
  const indexById = new Map(ordered.map((shot, index) => [shot.id, index]));
  const shots = project.production.shots.map((shot) => {
    const index = indexById.get(shot.id) ?? 0;
    const number = String((index + 1) * increment).padStart(3, "0");
    const name = `${safePrefix}${number}`;
    return { ...shot, name, outputName: `${name}_T${String(shot.takeNumber).padStart(2, "0")}`, outputFolder: name, updatedAt: new Date().toISOString() };
  });
  return complete(project, shots, shots.map((shot) => shot.id));
}

export function normalizeShotOutputs(project: MineMotionProject): ShotBatchResult {
  const shots = project.production.shots.map((shot) => {
    const base = sanitize(shot.name);
    return {
      ...shot,
      outputName: `${base}_T${String(shot.takeNumber).padStart(2, "0")}_R${String(shot.revision).padStart(2, "0")}`,
      outputFolder: `${base}/take_${String(shot.takeNumber).padStart(2, "0")}`,
      renderPreset: {
        ...shot.renderPreset,
        outputName: `${base}_T${String(shot.takeNumber).padStart(2, "0")}`,
        startFrame: shot.startFrame,
        endFrame: shot.endFrame,
        cameraId: shot.cameraId
      },
      updatedAt: new Date().toISOString()
    };
  });
  return complete(project, shots, shots.map((shot) => shot.id));
}

export function applyShotHandles(project: MineMotionProject, handles: number): ShotBatchResult {
  const amount = Math.max(0, Math.min(project.animation.fps * 5, Math.round(handles)));
  const shots = project.production.shots.map((shot) => ({
    ...shot,
    renderPreset: {
      ...shot.renderPreset,
      startFrame: Math.max(0, shot.startFrame - amount),
      endFrame: Math.min(project.animation.durationFrames, shot.endFrame + amount)
    },
    updatedAt: new Date().toISOString()
  }));
  return complete(project, shots, shots.map((shot) => shot.id));
}

export function setBatchShotStatus(project: MineMotionProject, status: ShotStatus, onlyEnabled = true): ShotBatchResult {
  const affected: string[] = [];
  const shots = project.production.shots.map((shot) => {
    if (onlyEnabled && !shot.enabled) return shot;
    affected.push(shot.id);
    return { ...shot, status, approved: status === "approved" || status === "final", updatedAt: new Date().toISOString() };
  });
  return complete(project, shots, affected);
}

export function setBatchRenderPasses(project: MineMotionProject, passes: RenderPassId[]): ShotBatchResult {
  const unique = [...new Set(passes)].filter((pass): pass is RenderPassId => ["beauty", "alpha", "world", "characters", "vfx", "depth", "normals", "object-id"].includes(pass));
  const safe = unique.length > 0 ? unique : ["beauty" as const];
  const shots = project.production.shots.map((shot) => ({ ...shot, renderPasses: safe, updatedAt: new Date().toISOString() }));
  return complete(project, shots, shots.map((shot) => shot.id));
}

export function enableOnlyApprovedTakes(project: MineMotionProject): ShotBatchResult {
  const approvedGroups = new Set(project.production.shots.filter((shot) => shot.approved).map((shot) => shot.takeGroupId));
  const affected: string[] = [];
  const shots = project.production.shots.map((shot) => {
    const groupHasApproved = approvedGroups.has(shot.takeGroupId);
    const enabled = groupHasApproved ? shot.approved : shot.activeTake && !shot.rejected;
    if (enabled !== shot.enabled) affected.push(shot.id);
    return { ...shot, enabled };
  });
  return complete(project, shots, affected);
}

export function trimTimelineToActiveShots(project: MineMotionProject, tailFrames = 12): ShotBatchResult {
  const active = project.production.shots.filter((shot) => shot.enabled && !shot.rejected);
  if (active.length === 0) return { project, changed: false, affectedShotIds: [], error: "NO_ACTIVE_SHOTS" };
  const durationFrames = Math.max(1, ...active.map((shot) => shot.endFrame + Math.max(0, Math.round(tailFrames))));
  const next = syncCinematicTimeline({
    ...project,
    projectSettings: { ...project.projectSettings, durationFrames },
    animation: { ...project.animation, durationFrames, currentFrame: Math.min(project.animation.currentFrame, durationFrames) },
    exportSettings: { ...project.exportSettings, endFrame: durationFrames }
  });
  return { project: next, changed: true, affectedShotIds: active.map((shot) => shot.id), error: null };
}

function complete(project: MineMotionProject, shots: MineMotionProject["production"]["shots"], affectedShotIds: string[]): ShotBatchResult {
  const next = syncCinematicTimeline({
    ...project,
    production: { ...project.production, shots },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, affectedShotIds, error: null };
}

function sanitize(value: string): string {
  return value.trim().replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "Shot";
}
