export type AudioClipSourceKind = "builtin-placeholder" | "imported";

export interface AudioClip {
  id: string;
  name: string;
  sourceKind: AudioClipSourceKind;
  sourceName: string;
  mimeType: string;
  dataUrl: string;
  startFrame: number;
  durationFrames: number;
  volume: number;
  loop: boolean;
  importedAt: string;
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
}
