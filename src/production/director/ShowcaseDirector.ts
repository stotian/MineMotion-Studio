import type { MineMotionProject } from "../../project/ProjectFile";
import type { DirectorSequenceBlueprint } from "./DirectorSequenceBuilder";

export interface ShowcaseSequenceOptions {
  subjectId: string;
  startFrame?: number;
  secondsPerShot?: number;
}

export function createShowcaseSequenceBlueprint(
  project: MineMotionProject,
  options: ShowcaseSequenceOptions
): DirectorSequenceBlueprint {
  const startFrame = Math.max(0, Math.round(options.startFrame ?? project.animation.currentFrame));
  const duration = Math.max(16, Math.round((options.secondsPerShot ?? 2.75) * project.animation.fps));
  return {
    name: "Character showcase",
    requests: [
      { kind: "reveal", subjectIds: [options.subjectId], startFrame, durationFrames: duration * 2, name: "Showcase Reveal", yawDegrees: -40 },
      { kind: "medium", subjectIds: [options.subjectId], startFrame: startFrame + duration * 2, durationFrames: duration, name: "Showcase Medium", yawDegrees: 20 },
      { kind: "orbit-left", subjectIds: [options.subjectId], startFrame: startFrame + duration * 3, durationFrames: duration * 2, name: "Showcase Orbit" },
      { kind: "close-up", subjectIds: [options.subjectId], startFrame: startFrame + duration * 5, durationFrames: duration, name: "Showcase Close-up", yawDegrees: -15 },
      { kind: "crane-rise", subjectIds: [options.subjectId], startFrame: startFrame + duration * 6, durationFrames: duration * 2, name: "Showcase Finale" }
    ]
  };
}
