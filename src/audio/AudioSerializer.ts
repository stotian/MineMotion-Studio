import type { AudioClip, AudioMarker, LipSyncCue, ProjectAudioData } from "./AudioTypes";
import { createId } from "../core/ids/Id";

export function withAudioClipDefaults(clip: Partial<AudioClip>): AudioClip {
  const durationFrames = boundedInteger(clip.durationFrames, 24, 1, 24 * 60 * 60 * 8);
  return {
    id: clip.id ?? createId("audio"),
    name: clip.name ?? "Audio Clip",
    sourceKind: clip.sourceKind ?? "builtin-placeholder",
    sourceName: clip.sourceName ?? clip.name ?? "unknown",
    mimeType: clip.mimeType ?? "",
    dataUrl: clip.dataUrl ?? "",
    startFrame: boundedInteger(clip.startFrame, 0, 0, Number.MAX_SAFE_INTEGER),
    durationFrames,
    sourceOffsetFrames: boundedInteger(clip.sourceOffsetFrames, 0, 0, Number.MAX_SAFE_INTEGER),
    fadeInFrames: boundedInteger(clip.fadeInFrames, 0, 0, durationFrames),
    fadeOutFrames: boundedInteger(clip.fadeOutFrames, 0, 0, durationFrames),
    volume: boundedNumber(clip.volume, 0.8, 0, 2),
    pan: boundedNumber(clip.pan, 0, -1, 1),
    muted: clip.muted ?? false,
    loop: clip.loop ?? false,
    role: clip.role === "dialogue" || clip.role === "music" || clip.role === "ambience" ? clip.role : "sfx",
    peak: nullableBounded(clip.peak, 0, 1),
    integratedLoudnessLufs: nullableBounded(clip.integratedLoudnessLufs, -120, 24),
    waveformHash: clip.waveformHash ?? "",
    decodeStatus: normalizeDecodeStatus(clip),
    importedAt: clip.importedAt ?? new Date(0).toISOString()
  };
}

export function sanitizeAudioClips(clips: Partial<AudioClip>[] | undefined): AudioClip[] {
  if (!Array.isArray(clips)) return [];
  return clips.slice(0, 10_000).map(withAudioClipDefaults);
}

export function sanitizeProjectAudio(audio: Partial<ProjectAudioData> | undefined): ProjectAudioData {
  return {
    schemaVersion: 2,
    clips: sanitizeAudioClips(audio?.clips),
    markers: Array.isArray(audio?.markers) ? audio.markers.slice(0, 50_000).flatMap(sanitizeMarker) : [],
    lipSyncCues: Array.isArray(audio?.lipSyncCues) ? audio.lipSyncCues.slice(0, 200_000).flatMap(sanitizeLipSyncCue) : [],
    masterGain: boundedNumber(audio?.masterGain, 1, 0, 2)
  };
}

function sanitizeMarker(marker: Partial<AudioMarker>): AudioMarker[] {
  if (!marker.id || typeof marker.name !== "string") return [];
  const type = marker.type === "dialogue" || marker.type === "beat" || marker.type === "action" ? marker.type : "sync";
  return [{
    id: marker.id,
    name: marker.name.slice(0, 160),
    frame: boundedInteger(marker.frame, 0, 0, Number.MAX_SAFE_INTEGER),
    type,
    color: typeof marker.color === "string" ? marker.color : "#66b3ff"
  }];
}

function sanitizeLipSyncCue(cue: Partial<LipSyncCue>): LipSyncCue[] {
  if (!cue.id || !cue.clipId || typeof cue.phoneme !== "string") return [];
  return [{
    id: cue.id,
    clipId: cue.clipId,
    frame: boundedInteger(cue.frame, 0, 0, Number.MAX_SAFE_INTEGER),
    phoneme: cue.phoneme.slice(0, 32),
    intensity: boundedNumber(cue.intensity, 1, 0, 1),
    source: cue.source === "phoneme-file" || cue.source === "marker-import" ? cue.source : "manual"
  }];
}

function normalizeDecodeStatus(clip: Partial<AudioClip>): AudioClip["decodeStatus"] {
  if (clip.decodeStatus === "ready" || clip.decodeStatus === "missing" || clip.decodeStatus === "corrupt") return clip.decodeStatus;
  if (clip.sourceKind === "imported" && !clip.dataUrl) return "missing";
  return clip.sourceKind === "builtin-placeholder" ? "ready" : "pending";
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(typeof value === "number" && Number.isFinite(value) ? value : fallback)));
}

function boundedNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, typeof value === "number" && Number.isFinite(value) ? value : fallback));
}

function nullableBounded(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : null;
}
