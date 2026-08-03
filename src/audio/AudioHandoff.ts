import type { MineMotionProject } from "../project/ProjectFile";
import type { AudioTrackRole } from "./AudioTypes";

export interface AudioStemPlan {
  role: AudioTrackRole | "full-mix";
  filename: string;
  clipIds: string[];
}

export interface AudioHandoffMetadata {
  schemaVersion: 1;
  projectName: string;
  fps: number;
  startFrame: number;
  endFrame: number;
  stems: AudioStemPlan[];
  markers: MineMotionProject["audio"]["markers"];
  lipSyncCues: MineMotionProject["audio"]["lipSyncCues"];
}

export function createAudioStemPlan(project: MineMotionProject, baseName: string): AudioStemPlan[] {
  const safe = baseName.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "minemotion-audio";
  const roles: AudioTrackRole[] = ["dialogue", "sfx", "music", "ambience"];
  return [
    { role: "full-mix", filename: `${safe}-full-mix.wav`, clipIds: project.audio.clips.map((clip) => clip.id) },
    ...roles.map((role) => ({ role, filename: `${safe}-${role}.wav`, clipIds: project.audio.clips.filter((clip) => clip.role === role).map((clip) => clip.id) }))
  ];
}

export function createAudioHandoffMetadata(project: MineMotionProject, startFrame = 0, endFrame = project.animation.durationFrames): AudioHandoffMetadata {
  return {
    schemaVersion: 1,
    projectName: project.projectName,
    fps: project.animation.fps,
    startFrame: Math.max(0, Math.round(startFrame)),
    endFrame: Math.max(startFrame, Math.round(endFrame)),
    stems: createAudioStemPlan(project, project.projectName),
    markers: project.audio.markers,
    lipSyncCues: project.audio.lipSyncCues
  };
}

export function serializeAudioHandoffMetadata(metadata: AudioHandoffMetadata): Blob {
  return new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
}
