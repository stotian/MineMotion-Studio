import type { MineMotionProject } from "../../project/ProjectFile";
import type { ProductionShot } from "../ShotTypes";

export type SequenceIssueSeverity = "info" | "warning" | "error";

export interface SequenceIssue {
  id: string;
  severity: SequenceIssueSeverity;
  frame: number;
  shotIds: string[];
  message: string;
}

export interface SequenceAnalysisReport {
  issues: SequenceIssue[];
  activeShotCount: number;
  coveredFrames: number;
  coverageRatio: number;
  averageShotLength: number;
}

export function analyzeProductionSequence(project: MineMotionProject): SequenceAnalysisReport {
  const shots = activeShots(project);
  const issues: SequenceIssue[] = [];
  let coveredFrames = 0;
  let cursor = 0;

  for (let index = 0; index < shots.length; index += 1) {
    const shot = shots[index];
    const length = shot.endFrame - shot.startFrame + 1;
    if (!project.scene.cameras.some((camera) => camera.id === shot.cameraId)) {
      issues.push(issue("error", shot.startFrame, [shot.id], `${shot.name} references a missing camera.`));
    }
    if (length < Math.max(4, Math.round(project.animation.fps * 0.35))) {
      issues.push(issue("warning", shot.startFrame, [shot.id], `${shot.name} is shorter than a readable cinematic beat.`));
    }
    if (shot.startFrame > cursor) {
      issues.push(issue("info", cursor, [shot.id], `There is an uncovered gap from frame ${cursor} to ${shot.startFrame - 1}.`));
    }
    if (shot.startFrame < cursor) {
      const previous = shots[index - 1];
      issues.push(issue(
        "warning",
        shot.startFrame,
        previous ? [previous.id, shot.id] : [shot.id],
        `${shot.name} overlaps another active take.`
      ));
    }
    const uncoveredStart = Math.max(cursor, shot.startFrame);
    if (shot.endFrame >= uncoveredStart) coveredFrames += shot.endFrame - uncoveredStart + 1;
    cursor = Math.max(cursor, shot.endFrame + 1);
  }

  if (shots.length > 0 && cursor <= project.animation.durationFrames) {
    issues.push(issue("info", cursor, [], `The sequence ends before the project timeline at frame ${cursor}.`));
  }
  const averageShotLength = shots.length === 0
    ? 0
    : shots.reduce((sum, shot) => sum + shot.endFrame - shot.startFrame + 1, 0) / shots.length;
  return {
    issues,
    activeShotCount: shots.length,
    coveredFrames,
    coverageRatio: project.animation.durationFrames <= 0
      ? 0
      : Math.min(1, coveredFrames / (project.animation.durationFrames + 1)),
    averageShotLength
  };
}

function activeShots(project: MineMotionProject): ProductionShot[] {
  return [...project.production.shots]
    .filter((shot) => shot.enabled && shot.activeTake)
    .sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame);
}

function issue(
  severity: SequenceIssueSeverity,
  frame: number,
  shotIds: string[],
  message: string
): SequenceIssue {
  return {
    id: `${severity}_${frame}_${shotIds.join("_") || "sequence"}`,
    severity,
    frame,
    shotIds,
    message
  };
}
