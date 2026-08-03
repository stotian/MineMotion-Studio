import type { MineMotionProject } from "../../project/ProjectFile";
import type { DirectorSequenceBlueprint } from "./DirectorSequenceBuilder";

export interface ActionSequenceOptions {
  heroId: string;
  opponentId?: string;
  startFrame?: number;
  secondsPerShot?: number;
  intensity?: number;
}

export function createActionSequenceBlueprint(
  project: MineMotionProject,
  options: ActionSequenceOptions
): DirectorSequenceBlueprint {
  const startFrame = Math.max(0, Math.round(options.startFrame ?? project.animation.currentFrame));
  const duration = Math.max(10, Math.round((options.secondsPerShot ?? 1.8) * project.animation.fps));
  const intensity = Math.min(2, Math.max(0.5, options.intensity ?? 1.15));
  const pair = options.opponentId && options.opponentId !== options.heroId
    ? [options.heroId, options.opponentId]
    : [options.heroId];
  return {
    name: "Action sequence",
    requests: [
      { kind: "establishing", subjectIds: pair, startFrame, durationFrames: duration, name: "Action Establishing", intensity },
      { kind: "tracking", subjectIds: [options.heroId], startFrame: startFrame + duration, durationFrames: duration * 2, name: "Hero Tracking", intensity },
      { kind: "low-angle", subjectIds: [options.heroId], startFrame: startFrame + duration * 3, durationFrames: duration, name: "Hero Low Angle", intensity },
      { kind: "orbit-right", subjectIds: pair, startFrame: startFrame + duration * 4, durationFrames: duration * 2, name: "Action Orbit", intensity },
      { kind: "close-up", subjectIds: [options.opponentId ?? options.heroId], startFrame: startFrame + duration * 6, durationFrames: duration, name: "Reaction Close-up", yawDegrees: -20, intensity },
      { kind: "reveal", subjectIds: pair, startFrame: startFrame + duration * 7, durationFrames: duration * 2, name: "Action Reveal", intensity },
      { kind: "crane-rise", subjectIds: pair, startFrame: startFrame + duration * 9, durationFrames: duration * 2, name: "Action Finale", intensity }
    ]
  };
}
