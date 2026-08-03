import { createId } from "../core/ids/Id";
import type { AudioMarker, AudioMarkerType, LipSyncCue, LipSyncSource } from "./AudioTypes";

export function createAudioMarker(name: string, frame: number, type: AudioMarkerType): AudioMarker {
  return { id: createId("audio-marker"), name: name.trim() || type, frame: Math.max(0, Math.round(frame)), type, color: markerColor(type) };
}

export function importPhonemeCues(
  clipId: string,
  text: string,
  fps: number,
  source: LipSyncSource = "phoneme-file"
): { cues: LipSyncCue[]; warnings: string[] } {
  const cues: LipSyncCue[] = [];
  const warnings: string[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [timeValue, phonemeValue, intensityValue] = trimmed.split(/[\s,;]+/);
    const time = Number(timeValue);
    const phoneme = phonemeValue?.trim();
    if (!Number.isFinite(time) || !phoneme) {
      warnings.push(`Line ${index + 1} is not a valid time/phoneme cue.`);
      continue;
    }
    cues.push({
      id: createId("lip-cue"),
      clipId,
      frame: Math.max(0, Math.round(time * fps)),
      phoneme: phoneme.slice(0, 32),
      intensity: Math.max(0, Math.min(1, Number.isFinite(Number(intensityValue)) ? Number(intensityValue) : 1)),
      source
    });
  }
  return { cues: cues.sort((left, right) => left.frame - right.frame), warnings };
}

function markerColor(type: AudioMarkerType): string {
  if (type === "dialogue") return "#66b3ff";
  if (type === "beat") return "#e7c45b";
  if (type === "action") return "#f07878";
  return "#a78bfa";
}
