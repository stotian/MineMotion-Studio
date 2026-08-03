export interface UltraEditorialClip { id: string; track: number; startFrame: number; sourceIn: number; sourceOut: number; speed: number; mediaId: string; offline: boolean; }
export interface UltraAudioBusInput { id: string; gainDb: number; pan: number; muted: boolean; }
export interface UltraCaptionCue { id: string; startFrame: number; endFrame: number; text: string; language: string; }

export function validateEditorialTimeline(clips: readonly UltraEditorialClip[]): string[] {
  const errors: string[] = []; const ids = new Set<string>();
  for (const clip of clips) {
    if (!clip.id || ids.has(clip.id)) errors.push("EDITORIAL_CLIP_ID_INVALID"); ids.add(clip.id);
    if (clip.startFrame < 0 || clip.sourceOut <= clip.sourceIn || clip.speed <= 0 || !Number.isFinite(clip.speed)) errors.push(`EDITORIAL_CLIP_RANGE_INVALID:${clip.id}`);
  }
  const byTrack = new Map<number, UltraEditorialClip[]>();
  for (const clip of clips) byTrack.set(clip.track, [...(byTrack.get(clip.track) ?? []), clip]);
  for (const track of byTrack.values()) {
    const sorted = [...track].sort((a, b) => a.startFrame - b.startFrame);
    for (let index = 1; index < sorted.length; index += 1) {
      const previousEnd = sorted[index - 1].startFrame + (sorted[index - 1].sourceOut - sorted[index - 1].sourceIn) / sorted[index - 1].speed;
      if (sorted[index].startFrame < previousEnd) errors.push(`EDITORIAL_OVERLAP:${sorted[index - 1].id}:${sorted[index].id}`);
    }
  }
  return [...new Set(errors)];
}

export function synchronizeMulticam(clips: readonly UltraEditorialClip[], syncOffsets: Readonly<Record<string, number>>): UltraEditorialClip[] {
  return clips.map((clip) => ({ ...clip, startFrame: clip.startFrame - (syncOffsets[clip.mediaId] ?? 0) })).sort((a, b) => a.startFrame - b.startFrame || a.track - b.track);
}

export function createProxyPlan(clips: readonly UltraEditorialClip[], maximumWidth: number): Array<{ mediaId: string; scale: number; cacheKey: string }> {
  const width = Math.max(16, maximumWidth);
  return [...new Set(clips.map((clip) => clip.mediaId))].sort().map((mediaId) => ({ mediaId, scale: width <= 640 ? 0.25 : width <= 1280 ? 0.5 : 1, cacheKey: hash(`${mediaId}:${width}`) }));
}

export function mixAudioBus(inputs: readonly UltraAudioBusInput[]): { linearGain: number; pan: number; activeInputs: number } {
  const active = inputs.filter((input) => !input.muted); if (active.length === 0) return { linearGain: 0, pan: 0, activeInputs: 0 };
  const linearGain = active.reduce((sum, input) => sum + Math.pow(10, clamp(input.gainDb, -96, 24) / 20), 0);
  const pan = active.reduce((sum, input) => sum + clamp(input.pan, -1, 1), 0) / active.length;
  return { linearGain, pan, activeInputs: active.length };
}

export function validateCaptionCues(cues: readonly UltraCaptionCue[]): string[] {
  const errors: string[] = []; const sorted = [...cues].sort((a, b) => a.startFrame - b.startFrame);
  for (let index = 0; index < sorted.length; index += 1) {
    const cue = sorted[index]; if (!cue.text.trim() || cue.endFrame <= cue.startFrame || !cue.language) errors.push(`CAPTION_INVALID:${cue.id}`);
    if (index > 0 && cue.startFrame < sorted[index - 1].endFrame) errors.push(`CAPTION_OVERLAP:${sorted[index - 1].id}:${cue.id}`);
  }
  return errors;
}

export function createInterchangeEvents(clips: readonly UltraEditorialClip[], fps: number): Array<{ clipId: string; timecode: string; durationFrames: number; mediaId: string }> {
  const rate = Math.max(1, Math.round(fps));
  return [...clips].sort((a, b) => a.startFrame - b.startFrame).map((clip) => ({ clipId: clip.id, timecode: frameToTimecode(clip.startFrame, rate), durationFrames: Math.round((clip.sourceOut - clip.sourceIn) / clip.speed), mediaId: clip.mediaId }));
}

export function relinkOfflineMedia(clips: readonly UltraEditorialClip[], replacements: Readonly<Record<string, string>>): UltraEditorialClip[] {
  return clips.map((clip) => replacements[clip.mediaId] ? { ...clip, mediaId: replacements[clip.mediaId], offline: false } : { ...clip });
}

export function sampleTransition(kind: "cut" | "crossfade" | "dip" | "wipe", progress: number): readonly [number, number] {
  const t = clamp(progress, 0, 1); if (kind === "cut") return t < 1 ? [1, 0] : [0, 1];
  if (kind === "dip") return t < 0.5 ? [1 - t * 2, 0] : [0, (t - 0.5) * 2];
  if (kind === "wipe") return [1 - t * t, t * t]; return [1 - t, t];
}

export function conformEditorial(source: readonly UltraEditorialClip[], destinationMediaIds: ReadonlySet<string>): { conformed: UltraEditorialClip[]; missingMediaIds: string[] } {
  const missing = new Set<string>();
  const conformed = source.map((clip) => { const available = destinationMediaIds.has(clip.mediaId); if (!available) missing.add(clip.mediaId); return { ...clip, offline: !available }; });
  return { conformed, missingMediaIds: [...missing].sort() };
}

export function validateMasteringTimeline(clips: readonly UltraEditorialClip[], captions: readonly UltraCaptionCue[]): { valid: boolean; errors: string[]; durationFrames: number } {
  const errors = [...validateEditorialTimeline(clips), ...validateCaptionCues(captions)];
  const durationFrames = clips.reduce((maximum, clip) => Math.max(maximum, clip.startFrame + (clip.sourceOut - clip.sourceIn) / clip.speed), 0);
  if (clips.some((clip) => clip.offline)) errors.push("MASTERING_OFFLINE_MEDIA");
  return { valid: errors.length === 0, errors, durationFrames: Math.ceil(durationFrames) };
}

function frameToTimecode(frame: number, fps: number): string { const safe = Math.max(0, Math.round(frame)); const ff = safe % fps; const totalSeconds = Math.floor(safe / fps); const ss = totalSeconds % 60; const totalMinutes = Math.floor(totalSeconds / 60); const mm = totalMinutes % 60; const hh = Math.floor(totalMinutes / 60); return [hh, mm, ss, ff].map((value) => String(value).padStart(2, "0")).join(":"); }
function hash(value: string): string { let result = 2166136261; for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619); return (result >>> 0).toString(16).padStart(8, "0"); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum)); }
