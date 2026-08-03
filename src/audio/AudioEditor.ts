import type { AudioClip, AudioMarker, LipSyncCue, ProjectAudioData } from "./AudioTypes";
import { sanitizeProjectAudio, withAudioClipDefaults } from "./AudioSerializer";

export function updateAudioClip(audio: ProjectAudioData, clipId: string, patch: Partial<AudioClip>): ProjectAudioData {
  return sanitizeProjectAudio({
    ...audio,
    clips: audio.clips.map((clip) => clip.id === clipId ? withAudioClipDefaults({ ...clip, ...patch, id: clip.id }) : clip)
  });
}

export function removeAudioClip(audio: ProjectAudioData, clipId: string): ProjectAudioData {
  return {
    ...audio,
    clips: audio.clips.filter((clip) => clip.id !== clipId),
    lipSyncCues: audio.lipSyncCues.filter((cue) => cue.clipId !== clipId)
  };
}

export function addAudioMarker(audio: ProjectAudioData, marker: AudioMarker): ProjectAudioData {
  return { ...audio, markers: [...audio.markers, marker].sort((left, right) => left.frame - right.frame) };
}

export function addLipSyncCues(audio: ProjectAudioData, cues: readonly LipSyncCue[]): ProjectAudioData {
  const clipIds = new Set(audio.clips.map((clip) => clip.id));
  return {
    ...audio,
    lipSyncCues: [...audio.lipSyncCues, ...cues.filter((cue) => clipIds.has(cue.clipId))]
      .sort((left, right) => left.frame - right.frame)
      .slice(0, 200_000)
  };
}
