import type { MineMotionProject } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { closeSequenceGaps } from "./ShotEditing";
import { synchronizeStoryboard } from "./StoryboardSync";
import { ensureCharacterCount } from "./FilmStarter";
import { createShowcaseSequenceBlueprint } from "./ShowcaseDirector";
import { buildDirectorSequence } from "./DirectorSequenceBuilder";
import { applyFilmLook } from "./FilmLook";

export type FilmPreflightSeverity = "error" | "warning" | "info";
export interface FilmPreflightIssue {
  id: string;
  severity: FilmPreflightSeverity;
  message: string;
  autoFixable: boolean;
}
export interface FilmPreflightReport {
  ready: boolean;
  score: number;
  issues: FilmPreflightIssue[];
  activeShotCount: number;
  durationFrames: number;
}
export interface FilmRepairResult {
  project: MineMotionProject;
  changed: boolean;
  fixes: string[];
  remaining: FilmPreflightReport;
}

export function inspectFilmProject(project: MineMotionProject): FilmPreflightReport {
  const issues: FilmPreflightIssue[] = [];
  const activeShots = project.production.shots.filter((shot) => shot.enabled && shot.activeTake).sort((a, b) => a.startFrame - b.startFrame);
  const cameraIds = new Set(project.scene.cameras.map((camera) => camera.id));
  const push = (id: string, severity: FilmPreflightSeverity, message: string, autoFixable: boolean) => issues.push({ id, severity, message, autoFixable });
  if (project.scene.characters.length === 0) push("cast-empty", "error", "No character is available for direction.", true);
  if (activeShots.length === 0) push("shots-empty", "error", "The film has no active production shots.", true);
  const missingCameraShots = activeShots.filter((shot) => !cameraIds.has(shot.cameraId));
  if (missingCameraShots.length > 0) push("shot-camera-missing", "error", `${missingCameraShots.length} active shot(s) reference missing cameras.`, true);
  if (!project.scene.cameras.some((camera) => camera.id === project.activeCameraId)) push("active-camera-invalid", "error", "The active camera no longer exists.", true);
  const cameraLane = project.animation.timelineTracks.find((lane) => lane.type === "camera");
  if ((cameraLane?.items.length ?? 0) !== activeShots.length) push("camera-lane-stale", "warning", "Camera cuts are not synchronized with active shots.", true);
  const storyboardShotIds = new Set(project.production.storyboard.flatMap((card) => card.shotId ? [card.shotId] : []));
  if (activeShots.some((shot) => !storyboardShotIds.has(shot.id))) push("storyboard-stale", "warning", "Storyboard cards are missing for one or more active shots.", true);
  for (let index = 1; index < activeShots.length; index += 1) {
    const previous = activeShots[index - 1];
    const current = activeShots[index];
    if (current.startFrame > previous.endFrame + 1) {
      push("shot-gap", "warning", "The active camera sequence contains uncovered frames.", true);
      break;
    }
  }
  for (let index = 1; index < activeShots.length; index += 1) {
    if (activeShots[index].startFrame <= activeShots[index - 1].endFrame) {
      push("shot-overlap", "warning", "The active camera sequence contains overlapping cuts.", false);
      break;
    }
  }
  const requiredDuration = activeShots.reduce((max, shot) => Math.max(max, shot.endFrame), 0);
  if (project.animation.durationFrames < requiredDuration || project.projectSettings.durationFrames < requiredDuration) {
    push("duration-short", "error", "The project duration ends before the final active shot.", true);
  }
  if (!project.renderSettings.renderPreviewEnabled) push("preview-off", "warning", "Final render preview is disabled.", true);
  if (project.renderSettings.resolutionPreset === "720p") push("resolution-low", "warning", "The project is still using the 720p draft resolution.", true);
  if (!project.renderSettings.cinematicBarsEnabled) push("bars-off", "info", "Cinematic framing bars are disabled.", true);
  if (project.audio.clips.every((clip) => clip.role !== "dialogue" && clip.role !== "music")) push("audio-empty", "info", "No dialogue or music is placed on the timeline.", false);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 22 - warningCount * 8 - issues.filter((issue) => issue.severity === "info").length * 2);
  return { ready: errorCount === 0 && warningCount === 0, score, issues, activeShotCount: activeShots.length, durationFrames: requiredDuration };
}

export function autoRepairFilmProject(project: MineMotionProject): FilmRepairResult {
  const before = JSON.stringify(project);
  const fixes: string[] = [];
  let next = project;
  if (next.scene.characters.length === 0) {
    const cast = ensureCharacterCount(next, 1);
    next = cast.project;
    fixes.push("created-default-actor");
  }
  const validCameraIds = new Set(next.scene.cameras.map((camera) => camera.id));
  const filteredShots = next.production.shots.filter((shot) => !shot.enabled || !shot.activeTake || validCameraIds.has(shot.cameraId));
  if (filteredShots.length !== next.production.shots.length) {
    next = { ...next, production: { ...next.production, shots: filteredShots } };
    fixes.push("removed-invalid-camera-shots");
  }
  if (!next.production.shots.some((shot) => shot.enabled && shot.activeTake)) {
    const actorId = next.scene.characters[0].id;
    const built = buildDirectorSequence(next, createShowcaseSequenceBlueprint(next, {
      subjectId: actorId,
      startFrame: next.animation.currentFrame,
      secondsPerShot: 2
    }));
    next = built.project;
    fixes.push("created-showcase-sequence");
  }
  const closed = closeSequenceGaps(next);
  if (closed.changed) {
    next = closed.project;
    fixes.push("closed-shot-gaps");
  }
  const activeShots = next.production.shots.filter((shot) => shot.enabled && shot.activeTake);
  const finalFrame = activeShots.reduce((max, shot) => Math.max(max, shot.endFrame), 0);
  if (next.animation.durationFrames < finalFrame || next.projectSettings.durationFrames < finalFrame) {
    next = {
      ...next,
      projectSettings: { ...next.projectSettings, durationFrames: Math.max(next.projectSettings.durationFrames, finalFrame) },
      animation: { ...next.animation, durationFrames: Math.max(next.animation.durationFrames, finalFrame) }
    };
    fixes.push("extended-project-duration");
  }
  const firstCameraId = activeShots[0]?.cameraId ?? next.scene.cameras[0]?.id ?? "";
  if (!next.scene.cameras.some((camera) => camera.id === next.activeCameraId) && firstCameraId) {
    next = {
      ...next,
      activeCameraId: firstCameraId,
      scene: {
        ...next.scene,
        cameras: next.scene.cameras.map((camera) => ({ ...camera, active: camera.id === firstCameraId }))
      }
    };
    fixes.push("restored-active-camera");
  }
  if (!next.renderSettings.renderPreviewEnabled || next.renderSettings.resolutionPreset === "720p") {
    next = applyFilmLook(next, "golden-epic");
    fixes.push("applied-cinematic-output-defaults");
  } else if (!next.renderSettings.cinematicBarsEnabled) {
    next = {
      ...next,
      renderSettings: { ...next.renderSettings, cinematicBarsEnabled: true, cinematicBarsRatio: "2.35:1" }
    };
    fixes.push("enabled-cinematic-bars");
  }
  next = syncCinematicTimeline(synchronizeStoryboard(next));
  fixes.push("synchronized-storyboard-and-timeline");
  next = { ...next, metadata: { ...next.metadata, updatedAt: new Date().toISOString() } };
  return {
    project: next,
    changed: before !== JSON.stringify(next),
    fixes: [...new Set(fixes)],
    remaining: inspectFilmProject(next)
  };
}
