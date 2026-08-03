import type { MineMotionProject } from "../../project/ProjectFile";
import type { ProductionShot } from "../ShotTypes";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { applyCinemaCameraProfile, autoFrameShot, setCameraFocusTarget } from "./ProfessionalCamera";
import { createStudioLightingRig } from "./StudioLightingRigs";
import { analyzeShotContinuity, alignDialogueEyelines } from "./ContinuityDirector";
import { inspectFilmProject, autoRepairFilmProject } from "./FilmPreflight";
import { buildStudioRenderPlan } from "./StudioRenderPipeline";

export type StudioQualityCategoryId = "camera" | "takes" | "lighting" | "continuity" | "audio" | "render";
export type StudioQualitySeverity = "error" | "warning" | "info";

export interface StudioQualityIssue {
  id: string;
  category: StudioQualityCategoryId;
  severity: StudioQualitySeverity;
  message: string;
  shotId?: string;
  autoFixable: boolean;
}

export interface StudioQualityCategory {
  id: StudioQualityCategoryId;
  score: number;
  passed: number;
  total: number;
  issues: StudioQualityIssue[];
}

export interface ShotQualitySnapshot {
  shotId: string;
  name: string;
  score: number;
  cameraReady: boolean;
  takeReady: boolean;
  renderReady: boolean;
  issueIds: string[];
}

export interface StudioQualityReport {
  overallScore: number;
  ready: boolean;
  categories: StudioQualityCategory[];
  issues: StudioQualityIssue[];
  shots: ShotQualitySnapshot[];
  worstShotId: string | null;
  generatedAt: string;
}

export interface StudioQualityMutation {
  project: MineMotionProject;
  changed: boolean;
  actions: string[];
  report: StudioQualityReport;
}

export function analyzeStudioQuality(project: MineMotionProject): StudioQualityReport {
  const activeShots = activeProductionShots(project);
  const usableShots = usableProductionShots(project);
  const camera = evaluateCameraQuality(project, activeShots);
  const takes = evaluateTakeQuality(usableShots);
  const lighting = evaluateLightingQuality(project, activeShots);
  const continuity = evaluateContinuityQuality(project, activeShots);
  const audio = evaluateAudioQuality(project, activeShots);
  const render = evaluateRenderQuality(project, activeShots);
  const categories = [camera, takes, lighting, continuity, audio, render];
  const issues = categories.flatMap((category) => category.issues);
  const shots = buildShotQualitySnapshots(project, activeShots, issues);
  const weighted = categories.reduce((sum, category) => sum + category.score, 0) / Math.max(1, categories.length);
  const overallScore = Math.round(weighted);
  const worst = [...shots].sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))[0] ?? null;
  return {
    overallScore,
    ready: overallScore >= 85 && !issues.some((issue) => issue.severity === "error"),
    categories,
    issues,
    shots,
    worstShotId: worst?.shotId ?? null,
    generatedAt: new Date().toISOString()
  };
}

export function evaluateCameraQuality(project: MineMotionProject, shots = activeProductionShots(project)): StudioQualityCategory {
  const issues: StudioQualityIssue[] = [];
  let passed = 0;
  for (const shot of shots) {
    const camera = project.scene.cameras.find((candidate) => candidate.id === shot.cameraId);
    if (!camera) {
      issues.push(issue("camera-missing", "camera", "error", `${shot.name} has no valid camera.`, shot.id, true));
      continue;
    }
    const physical = typeof camera.metadata.cinemaProfileId === "string" && Number(camera.metadata.sensorWidthMm) > 0;
    const focus = typeof camera.metadata.focusTargetId === "string" && Number(camera.metadata.focusDistance) > 0;
    if (!physical) issues.push(issue("camera-profile", "camera", "warning", `${shot.name} has no physical cinema profile.`, shot.id, true));
    if (!focus) issues.push(issue("camera-focus", "camera", "warning", `${shot.name} has no explicit focus target.`, shot.id, true));
    if (camera.focalLength < 12 || camera.focalLength > 200) issues.push(issue("camera-lens-range", "camera", "warning", `${shot.name} uses an extreme focal length.`, shot.id, true));
    if (physical && focus) passed += 1;
  }
  return category("camera", passed, shots.length, issues);
}

export function evaluateTakeQuality(shots: ProductionShot[]): StudioQualityCategory {
  const issues: StudioQualityIssue[] = [];
  const groups = new Map<string, ProductionShot[]>();
  for (const shot of shots) groups.set(shot.takeGroupId, [...(groups.get(shot.takeGroupId) ?? []), shot]);
  let passed = 0;
  for (const [groupId, group] of groups) {
    const active = group.find((shot) => shot.activeTake && !shot.rejected);
    const approved = group.find((shot) => shot.approved && !shot.rejected);
    if (!active) issues.push(issue("take-active", "takes", "error", `Take group ${groupId} has no active usable take.`, undefined, true));
    if (!approved) issues.push(issue("take-approved", "takes", "warning", `Take group ${groupId} has not been approved.`, active?.id, true));
    if (active && active.rating <= 0) issues.push(issue("take-unrated", "takes", "info", `${active.name} has not been rated.`, active.id, false));
    if (active && approved) passed += 1;
  }
  return category("takes", passed, groups.size, issues);
}

export function evaluateLightingQuality(project: MineMotionProject, shots = activeProductionShots(project)): StudioQualityCategory {
  const issues: StudioQualityIssue[] = [];
  const visibleLights = project.scene.lights.filter((light) => light.visible && light.intensity > 0);
  if (visibleLights.length === 0) issues.push(issue("lighting-empty", "lighting", "warning", "No visible scene lights are configured.", undefined, true));
  if (!project.lighting.shadowsEnabled) issues.push(issue("lighting-shadows", "lighting", "info", "Scene shadows are disabled.", undefined, true));
  if (project.lighting.ambientIntensity > 1.5) issues.push(issue("lighting-flat", "lighting", "warning", "Ambient lighting is high enough to flatten contrast.", undefined, true));
  const passed = visibleLights.length > 0 && project.lighting.shadowsEnabled ? shots.length : 0;
  return category("lighting", passed, Math.max(1, shots.length), issues);
}

export function evaluateContinuityQuality(project: MineMotionProject, shots = activeProductionShots(project)): StudioQualityCategory {
  const issues: StudioQualityIssue[] = [];
  const actors = project.scene.characters.slice(0, 2);
  if (actors.length >= 2 && shots.length >= 2) {
    const report = analyzeShotContinuity(project, actors[0].id, actors[1].id);
    for (const finding of report.findings) {
      const shot = project.production.shots.find((candidate) => candidate.id === finding.shotId);
      const shotName = shot?.name ?? finding.shotId;
      if (finding.crossedAxis && !shot?.reviewTags.includes("intentional-axis-crossing")) {
        issues.push(issue("continuity-axis", "continuity", "warning", `${shotName} crosses the established dialogue axis.`, finding.shotId, true));
      }
      if (finding.lensJump) {
        issues.push(issue("continuity-lens", "continuity", "warning", `${shotName} creates a large focal-length jump.`, finding.shotId, true));
      }
      if (finding.angleJumpDegrees < 20) {
        issues.push(issue("continuity-jump-cut", "continuity", "warning", `${shotName} is too close to the previous camera angle (${finding.angleJumpDegrees}°).`, finding.shotId, false));
      }
    }
  }
  const preflight = inspectFilmProject(project);
  for (const finding of preflight.issues.filter((entry) => ["shot-gap", "shot-overlap", "camera-lane-stale", "storyboard-stale"].includes(entry.id))) {
    issues.push(issue(`continuity-${finding.id}`, "continuity", finding.severity, finding.message, undefined, finding.autoFixable));
  }
  return category("continuity", Math.max(0, shots.length - issues.filter((entry) => entry.severity !== "info").length), shots.length, issues);
}

export function evaluateAudioQuality(project: MineMotionProject, shots = activeProductionShots(project)): StudioQualityCategory {
  const issues: StudioQualityIssue[] = [];
  const dialogue = project.audio.clips.filter((clip) => clip.role === "dialogue");
  const music = project.audio.clips.filter((clip) => clip.role === "music");
  const effects = project.audio.clips.filter((clip) => clip.role === "sfx" || clip.role === "ambience");
  if (dialogue.length === 0) issues.push(issue("audio-dialogue", "audio", "info", "No dialogue recording or placeholder is scheduled.", undefined, false));
  if (music.length === 0) issues.push(issue("audio-music", "audio", "info", "No music cue is scheduled.", undefined, false));
  if (effects.length === 0) issues.push(issue("audio-effects", "audio", "warning", "No sound-effect or ambience layer is scheduled.", undefined, false));
  const duration = Math.max(1, project.animation.durationFrames);
  const covered = project.audio.clips.filter((clip) => clip.startFrame <= duration && clip.startFrame + Math.max(1, clip.durationFrames) >= 0).length;
  const passed = covered > 0 ? Math.max(1, Math.round(shots.length * Math.min(1, covered / Math.max(1, shots.length)))) : 0;
  return category("audio", passed, Math.max(1, shots.length), issues);
}

export function evaluateRenderQuality(project: MineMotionProject, shots = activeProductionShots(project)): StudioQualityCategory {
  const issues: StudioQualityIssue[] = [];
  let passed = 0;
  for (const shot of shots) {
    if (!shot.renderPasses.includes("beauty")) issues.push(issue("render-beauty", "render", "error", `${shot.name} is missing its beauty pass.`, shot.id, true));
    if (shot.renderPreset.width < 1280 || shot.renderPreset.height < 720) issues.push(issue("render-resolution", "render", "warning", `${shot.name} is below 720p.`, shot.id, true));
    if (shot.renderPreset.fps !== project.animation.fps) issues.push(issue("render-fps", "render", "warning", `${shot.name} FPS differs from the project.`, shot.id, true));
    if (!shot.outputName.trim()) issues.push(issue("render-output", "render", "error", `${shot.name} has no output name.`, shot.id, true));
    if (shot.renderPasses.includes("beauty") && shot.renderPreset.width >= 1280 && shot.renderPreset.height >= 720 && shot.outputName.trim()) passed += 1;
  }
  const plan = buildStudioRenderPlan(project, "preview", "approved");
  if (shots.some((shot) => shot.approved) && plan.jobs.length === 0) issues.push(issue("render-plan-empty", "render", "warning", "Approved shots do not produce a preview render plan.", undefined, true));
  return category("render", passed, shots.length, issues);
}

export function buildShotQualitySnapshots(
  project: MineMotionProject,
  shots = activeProductionShots(project),
  reportIssues = analyzeStudioQualityWithoutShots(project).issues
): ShotQualitySnapshot[] {
  return shots.map((shot) => {
    const camera = project.scene.cameras.find((candidate) => candidate.id === shot.cameraId);
    const cameraReady = Boolean(camera && camera.metadata.cinemaProfileId && camera.metadata.focusTargetId);
    const takeReady = shot.activeTake && shot.approved && !shot.rejected;
    const renderReady = shot.renderPasses.includes("beauty") && shot.renderPreset.width >= 1280 && shot.renderPreset.height >= 720 && Boolean(shot.outputName.trim());
    const issueIds = reportIssues.filter((entry) => entry.shotId === shot.id).map((entry) => entry.id);
    const score = Math.max(0, Math.round((Number(cameraReady) + Number(takeReady) + Number(renderReady)) / 3 * 100 - issueIds.length * 4));
    return { shotId: shot.id, name: shot.name, score, cameraReady, takeReady, renderReady, issueIds };
  });
}

export function selectLowestQualityShot(project: MineMotionProject): StudioQualityMutation {
  const report = analyzeStudioQuality(project);
  if (!report.worstShotId || report.worstShotId === project.production.activeShotId) {
    return { project, changed: false, actions: [], report };
  }
  const next = { ...project, production: { ...project.production, activeShotId: report.worstShotId } };
  return { project: next, changed: true, actions: ["selected-lowest-quality-shot"], report: analyzeStudioQuality(next) };
}

export function autoPolishStudioProject(project: MineMotionProject): StudioQualityMutation {
  let next = project;
  const actions: string[] = [];
  const repaired = autoRepairFilmProject(next);
  if (repaired.changed) {
    next = repaired.project;
    actions.push(...repaired.fixes);
  }
  const actors = next.scene.characters.slice(0, 2);
  const primaryId = actors[0]?.id ?? "";
  const secondaryId = actors[1]?.id ?? "";
  for (const shot of activeProductionShots(next)) {
    const profile = applyCinemaCameraProfile(next, shot.id, "natural-35");
    if (profile.changed) {
      next = profile.project;
      actions.push(`camera-profile:${shot.id}`);
    }
    if (primaryId) {
      const focus = setCameraFocusTarget(next, shot.id, primaryId);
      if (focus.changed) {
        next = focus.project;
        actions.push(`camera-focus:${shot.id}`);
      }
      const subjects = secondaryId ? [primaryId, secondaryId] : [primaryId];
      const frame = autoFrameShot(next, shot.id, subjects, subjects.length > 1 ? "medium" : "close");
      if (frame.changed) {
        next = frame.project;
        actions.push(`camera-frame:${shot.id}`);
      }
    }
  }
  if (next.scene.lights.filter((light) => light.visible && light.intensity > 0).length === 0) {
    const lit = createStudioLightingRig(next, "three-point", primaryId || undefined);
    if (lit.changed) {
      next = lit.project;
      actions.push("created-three-point-lighting");
    }
  }
  if (primaryId && secondaryId) {
    const eyelines = alignDialogueEyelines(next, primaryId, secondaryId);
    if (eyelines.changed) {
      next = eyelines.project;
      actions.push("aligned-dialogue-eyelines");
    }
  }
  next = markQualityReadyShots(next).project;
  actions.push("updated-shot-readiness");
  next = syncCinematicTimeline(next);
  return { project: next, changed: JSON.stringify(next) !== JSON.stringify(project), actions: [...new Set(actions)], report: analyzeStudioQuality(next) };
}

export function markQualityReadyShots(project: MineMotionProject, threshold = 80): StudioQualityMutation {
  const report = analyzeStudioQuality(project);
  const scores = new Map(report.shots.map((shot) => [shot.shotId, shot.score]));
  const now = new Date().toISOString();
  const changedIds: string[] = [];
  const shots = project.production.shots.map((shot) => {
    const score = scores.get(shot.id);
    if (score === undefined) return shot;
    const ready = score >= threshold && !shot.rejected;
    const status = ready && shot.status === "planned" ? "ready" as const : shot.status;
    if (status !== shot.status) changedIds.push(shot.id);
    return status === shot.status ? shot : { ...shot, status, updatedAt: now };
  });
  const next = changedIds.length > 0 ? { ...project, production: { ...project.production, shots } } : project;
  return { project: next, changed: changedIds.length > 0, actions: changedIds.map((id) => `marked-ready:${id}`), report: analyzeStudioQuality(next) };
}

export function createStudioQualityReportMarkdown(project: MineMotionProject): string {
  const report = analyzeStudioQuality(project);
  const lines = [
    `# ${project.projectName} — Studio quality report`,
    "",
    `Overall score: **${report.overallScore}/100**`,
    `Ready: **${report.ready ? "yes" : "no"}**`,
    "",
    "## Categories",
    "",
    "| Category | Score | Passed | Issues |",
    "|---|---:|---:|---:|",
    ...report.categories.map((entry) => `| ${entry.id} | ${entry.score}/100 | ${entry.passed}/${entry.total} | ${entry.issues.length} |`),
    "",
    "## Shot readiness",
    "",
    "| Shot | Score | Camera | Take | Render |",
    "|---|---:|---|---|---|",
    ...report.shots.map((shot) => `| ${shot.name} | ${shot.score}/100 | ${shot.cameraReady ? "ready" : "fix"} | ${shot.takeReady ? "ready" : "review"} | ${shot.renderReady ? "ready" : "fix"} |`),
    "",
    "## Issues",
    "",
    ...(report.issues.length === 0 ? ["No issues detected."] : report.issues.map((entry) => `- **${entry.severity.toUpperCase()} · ${entry.category}** — ${entry.message}${entry.autoFixable ? " _(auto-fixable)_" : ""}`))
  ];
  return lines.join("\n");
}

function analyzeStudioQualityWithoutShots(project: MineMotionProject): Omit<StudioQualityReport, "shots" | "worstShotId"> {
  const activeShots = activeProductionShots(project);
  const usableShots = usableProductionShots(project);
  const categories = [
    evaluateCameraQuality(project, activeShots),
    evaluateTakeQuality(usableShots),
    evaluateLightingQuality(project, activeShots),
    evaluateContinuityQuality(project, activeShots),
    evaluateAudioQuality(project, activeShots),
    evaluateRenderQuality(project, activeShots)
  ];
  const issues = categories.flatMap((category) => category.issues);
  const overallScore = Math.round(categories.reduce((sum, category) => sum + category.score, 0) / Math.max(1, categories.length));
  return { overallScore, ready: overallScore >= 85 && !issues.some((entry) => entry.severity === "error"), categories, issues, generatedAt: new Date().toISOString() };
}

function activeProductionShots(project: MineMotionProject): ProductionShot[] {
  return usableProductionShots(project)
    .filter((shot) => shot.activeTake)
    .sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame);
}

function usableProductionShots(project: MineMotionProject): ProductionShot[] {
  return [...project.production.shots]
    .filter((shot) => shot.enabled && !shot.rejected)
    .sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame);
}

function category(id: StudioQualityCategoryId, passed: number, total: number, issues: StudioQualityIssue[]): StudioQualityCategory {
  const safeTotal = Math.max(1, total);
  const base = total === 0 ? 0 : passed / safeTotal * 100;
  const penalty = issues.reduce((sum, entry) => sum + (entry.severity === "error" ? 28 : entry.severity === "warning" ? 10 : 3), 0);
  return { id, score: Math.max(0, Math.min(100, Math.round(base - penalty))), passed, total, issues };
}

function issue(id: string, categoryId: StudioQualityCategoryId, severity: StudioQualitySeverity, message: string, shotId: string | undefined, autoFixable: boolean): StudioQualityIssue {
  return { id: `${id}${shotId ? `:${shotId}` : ""}`, category: categoryId, severity, message, shotId, autoFixable };
}
