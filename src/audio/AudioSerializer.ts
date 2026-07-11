import type { AudioClip } from "./AudioTypes";
import { createId } from "../core/ids/Id";

export function withAudioClipDefaults(clip: Partial<AudioClip>): AudioClip {
  return {
    id: clip.id ?? createId("audio"),
    name: clip.name ?? "Audio Clip",
    sourceKind: clip.sourceKind ?? "builtin-placeholder",
    sourceName: clip.sourceName ?? clip.name ?? "unknown",
    mimeType: clip.mimeType ?? "",
    dataUrl: clip.dataUrl ?? "",
    startFrame: Math.max(0, Math.round(clip.startFrame ?? 0)),
    durationFrames: Math.max(1, Math.round(clip.durationFrames ?? 24)),
    volume: Math.min(1, Math.max(0, clip.volume ?? 0.8)),
    loop: clip.loop ?? false,
    importedAt: clip.importedAt ?? new Date(0).toISOString()
  };
}

export function sanitizeAudioClips(
  clips: Partial<AudioClip>[] | undefined
): AudioClip[] {
  if (!Array.isArray(clips)) return [];
  return clips.map(withAudioClipDefaults);
}
