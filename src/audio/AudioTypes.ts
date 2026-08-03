export type AudioClipSourceKind = "builtin-placeholder" | "imported";
export type AudioTrackRole = "dialogue" | "sfx" | "music" | "ambience";
export type AudioMarkerType = "dialogue" | "beat" | "action" | "sync";
export type LipSyncSource = "manual" | "phoneme-file" | "marker-import";

export interface AudioClip {
  id: string;
  name: string;
  sourceKind: AudioClipSourceKind;
  sourceName: string;
  mimeType: string;
  dataUrl: string;
  startFrame: number;
  durationFrames: number;
  sourceOffsetFrames: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  volume: number;
  pan: number;
  muted: boolean;
  loop: boolean;
  role: AudioTrackRole;
  peak: number | null;
  integratedLoudnessLufs: number | null;
  waveformHash: string;
  decodeStatus: "pending" | "ready" | "missing" | "corrupt";
  importedAt: string;
}

export interface AudioMarker {
  id: string;
  name: string;
  frame: number;
  type: AudioMarkerType;
  color: string;
}

export interface LipSyncCue {
  id: string;
  clipId: string;
  frame: number;
  phoneme: string;
  intensity: number;
  source: LipSyncSource;
}

export interface ProjectAudioData {
  schemaVersion: 2;
  clips: AudioClip[];
  markers: AudioMarker[];
  lipSyncCues: LipSyncCue[];
  masterGain: number;
}

export interface BuiltinSfxDefinition {
  id: string;
  name: string;
  description: string;
  suggestedDurationFrames: number;
  toneHz: number;
}

export interface TimelineAudioItem {
  clipId: string;
  startFrame: number;
  durationFrames: number;
  role: AudioTrackRole;
  muted: boolean;
}
