import type { MineMotionProject } from "../../project/ProjectFile";
import { getBuiltinSfx } from "../BuiltinSfxRegistry";
import type { AudioExportSettings } from "./AudioExportSettings";
import { DEFAULT_AUDIO_EXPORT_SETTINGS } from "./AudioExportSettings";
import { encodeWav } from "./WavEncoder";

export interface ProjectAudioMixdownOptions extends Partial<AudioExportSettings> {
  startFrame?: number;
  endFrame?: number;
}

export async function exportProjectWav(
  project: MineMotionProject,
  settings: ProjectAudioMixdownOptions = {}
): Promise<Blob> {
  if (typeof OfflineAudioContext === "undefined") {
    throw new Error("WAV mixdown is not supported in this browser.");
  }

  const audioSettings = { ...DEFAULT_AUDIO_EXPORT_SETTINGS, ...settings };
  const rangeStart = Math.max(0, Math.round(settings.startFrame ?? 0));
  const defaultEnd = Math.max(
    project.animation.durationFrames,
    ...project.audio.clips.map((clip) => clip.startFrame + clip.durationFrames)
  );
  const rangeEnd = Math.max(
    rangeStart,
    Math.round(settings.endFrame ?? defaultEnd)
  );
  const durationSeconds = Math.max(
    (rangeEnd - rangeStart + 1) / project.animation.fps,
    1 / project.animation.fps
  );
  const frameCount = Math.ceil(durationSeconds * audioSettings.sampleRate);
  const context = new OfflineAudioContext(
    audioSettings.channels,
    frameCount,
    audioSettings.sampleRate
  );

  for (const clip of project.audio.clips) {
    const clipEnd = clip.startFrame + clip.durationFrames;
    const overlapStart = Math.max(rangeStart, clip.startFrame);
    const overlapEnd = Math.min(rangeEnd + 1, clipEnd);
    if (overlapEnd <= overlapStart) continue;
    const startTime = (overlapStart - rangeStart) / project.animation.fps;
    const sourceOffset = (overlapStart - clip.startFrame) / project.animation.fps;
    const duration = (overlapEnd - overlapStart) / project.animation.fps;
    if (clip.sourceKind === "builtin-placeholder") {
      const sfx = getBuiltinSfx(clip.sourceName);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = sfx?.toneHz ?? 440;
      gain.gain.value = clip.volume;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
      continue;
    }

    if (!clip.dataUrl) continue;
    const decoded = await decodeAudioDataUrl(context, clip.dataUrl);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = decoded;
    source.loop = clip.loop;
    gain.gain.value = clip.volume;
    source.connect(gain).connect(context.destination);
    source.start(startTime, sourceOffset, duration);
  }

  const rendered = await context.startRendering();
  const channels = Array.from({ length: audioSettings.channels }, (_, index) =>
    rendered.getChannelData(Math.min(index, rendered.numberOfChannels - 1))
  );

  return encodeWav({
    sampleRate: rendered.sampleRate,
    channelData: channels
  });
}

async function decodeAudioDataUrl(
  context: OfflineAudioContext,
  dataUrl: string
): Promise<AudioBuffer> {
  const response = await fetch(dataUrl);
  const buffer = await response.arrayBuffer();
  return await context.decodeAudioData(buffer);
}
