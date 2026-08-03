import type { AudioClip } from "./AudioTypes";
import type { AudioWaveform } from "./AudioWaveform";

export interface AudioHealthWarning {
  clipId: string;
  severity: "info" | "warning" | "error";
  code: "missing" | "corrupt" | "clipping" | "too-loud" | "too-quiet";
  message: string;
}

export function estimateIntegratedLoudness(waveform: AudioWaveform): number {
  if (waveform.rms <= 0) return -120;
  return Math.max(-120, 20 * Math.log10(waveform.rms) - 0.691);
}

export function analyzeAudioClip(clip: AudioClip): AudioHealthWarning[] {
  const warnings: AudioHealthWarning[] = [];
  if (clip.decodeStatus === "missing") warnings.push({ clipId: clip.id, severity: "error", code: "missing", message: "Audio source is missing." });
  if (clip.decodeStatus === "corrupt") warnings.push({ clipId: clip.id, severity: "error", code: "corrupt", message: "Audio source could not be decoded." });
  if ((clip.peak ?? 0) >= 0.999) warnings.push({ clipId: clip.id, severity: "warning", code: "clipping", message: "Peak level may clip." });
  if ((clip.integratedLoudnessLufs ?? -24) > -9) warnings.push({ clipId: clip.id, severity: "warning", code: "too-loud", message: "Integrated loudness is unusually high." });
  if (clip.integratedLoudnessLufs !== null && clip.integratedLoudnessLufs < -48) warnings.push({ clipId: clip.id, severity: "info", code: "too-quiet", message: "Audio may be difficult to hear." });
  return warnings;
}

export function clipGainAtFrame(clip: AudioClip, frame: number): number {
  if (clip.muted || frame < clip.startFrame || frame >= clip.startFrame + clip.durationFrames) return 0;
  const local = frame - clip.startFrame;
  const fadeIn = clip.fadeInFrames > 0 ? Math.min(1, local / clip.fadeInFrames) : 1;
  const remaining = clip.durationFrames - local;
  const fadeOut = clip.fadeOutFrames > 0 ? Math.min(1, remaining / clip.fadeOutFrames) : 1;
  return clip.volume * Math.max(0, Math.min(fadeIn, fadeOut));
}
