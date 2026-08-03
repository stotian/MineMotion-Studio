import type { MineMotionProject } from "../../project/ProjectFile";
import { clipGainAtFrame } from "../AudioAnalysis";
import { getBuiltinSfx } from "../BuiltinSfxRegistry";
import type { AudioTrackRole } from "../AudioTypes";
import type { AudioExportSettings } from "./AudioExportSettings";
import { DEFAULT_AUDIO_EXPORT_SETTINGS } from "./AudioExportSettings";
import { encodeWav } from "./WavEncoder";

export interface ProjectAudioMixdownOptions extends Partial<AudioExportSettings> {
  startFrame?: number;
  endFrame?: number;
  roles?: AudioTrackRole[];
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export async function exportProjectWav(
  project: MineMotionProject,
  settings: ProjectAudioMixdownOptions = {}
): Promise<Blob> {
  if (typeof OfflineAudioContext === "undefined") throw new Error("WAV mixdown is not supported in this browser.");
  throwIfAborted(settings.signal);
  const audioSettings = { ...DEFAULT_AUDIO_EXPORT_SETTINGS, ...settings };
  const rangeStart = Math.max(0, Math.round(settings.startFrame ?? 0));
  const eligibleClips = project.audio.clips.filter((clip) => !settings.roles?.length || settings.roles.includes(clip.role));
  const defaultEnd = Math.max(project.animation.durationFrames, ...eligibleClips.map((clip) => clip.startFrame + clip.durationFrames));
  const rangeEnd = Math.max(rangeStart, Math.round(settings.endFrame ?? defaultEnd));
  const durationSeconds = Math.max((rangeEnd - rangeStart + 1) / project.animation.fps, 1 / project.animation.fps);
  const frameCount = Math.ceil(durationSeconds * audioSettings.sampleRate);
  const context = new OfflineAudioContext(audioSettings.channels, frameCount, audioSettings.sampleRate);
  const decodedCache = new Map<string, Promise<AudioBuffer>>();

  for (const [index, clip] of eligibleClips.entries()) {
    throwIfAborted(settings.signal);
    settings.onProgress?.(eligibleClips.length ? index / eligibleClips.length : 0);
    if (clip.muted || clip.decodeStatus === "missing" || clip.decodeStatus === "corrupt") continue;
    const clipEnd = clip.startFrame + clip.durationFrames;
    const overlapStart = Math.max(rangeStart, clip.startFrame);
    const overlapEnd = Math.min(rangeEnd + 1, clipEnd);
    if (overlapEnd <= overlapStart) continue;
    const startTime = (overlapStart - rangeStart) / project.animation.fps;
    const sourceOffset = (clip.sourceOffsetFrames + overlapStart - clip.startFrame) / project.animation.fps;
    const duration = (overlapEnd - overlapStart) / project.animation.fps;
    const gainValue = clipGainAtFrame(clip, overlapStart) * project.audio.masterGain;
    if (clip.sourceKind === "builtin-placeholder") {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = getBuiltinSfx(clip.sourceName)?.toneHz ?? 440;
      gain.gain.value = gainValue;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
      continue;
    }
    if (!clip.dataUrl) continue;
    const decoded = await getDecodedAudio(context, clip.dataUrl, decodedCache);
    throwIfAborted(settings.signal);
    const source = context.createBufferSource();
    const gain = context.createGain();
    const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
    source.buffer = decoded;
    source.loop = clip.loop;
    gain.gain.setValueAtTime(gainValue, startTime);
    if (clip.fadeInFrames > 0) gain.gain.linearRampToValueAtTime(clip.volume * project.audio.masterGain, startTime + Math.min(duration, clip.fadeInFrames / project.animation.fps));
    if (clip.fadeOutFrames > 0) {
      gain.gain.setValueAtTime(clip.volume * project.audio.masterGain, Math.max(startTime, startTime + duration - clip.fadeOutFrames / project.animation.fps));
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
    }
    source.connect(gain);
    if (panner) { panner.pan.value = clip.pan; gain.connect(panner).connect(context.destination); }
    else gain.connect(context.destination);
    source.start(startTime, Math.max(0, sourceOffset), duration);
  }

  throwIfAborted(settings.signal);
  const rendered = await context.startRendering();
  throwIfAborted(settings.signal);
  const channels = Array.from({ length: audioSettings.channels }, (_, index) => rendered.getChannelData(Math.min(index, rendered.numberOfChannels - 1)));
  settings.onProgress?.(1);
  return encodeWav({ sampleRate: rendered.sampleRate, channelData: channels });
}

async function getDecodedAudio(context: OfflineAudioContext, dataUrl: string, cache: Map<string, Promise<AudioBuffer>>): Promise<AudioBuffer> {
  const existing = cache.get(dataUrl);
  if (existing) return await existing;
  const promise = fetch(dataUrl).then((response) => response.arrayBuffer()).then((buffer) => context.decodeAudioData(buffer));
  cache.set(dataUrl, promise);
  return await promise;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Audio mixdown cancelled.", "AbortError");
}
