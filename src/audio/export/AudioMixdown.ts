import type { MineMotionProject } from "../../project/ProjectFile";
import { getBuiltinSfx } from "../BuiltinSfxRegistry";
import type { AudioExportSettings } from "./AudioExportSettings";
import { DEFAULT_AUDIO_EXPORT_SETTINGS } from "./AudioExportSettings";
import { encodeWav } from "./WavEncoder";

export async function exportProjectWav(
  project: MineMotionProject,
  settings: Partial<AudioExportSettings> = {}
): Promise<Blob> {
  if (typeof OfflineAudioContext === "undefined") {
    throw new Error("WAV mixdown is not supported in this browser.");
  }

  const audioSettings = { ...DEFAULT_AUDIO_EXPORT_SETTINGS, ...settings };
  const durationSeconds = Math.max(
    project.animation.durationFrames / project.animation.fps,
    ...project.audio.clips.map(
      (clip) => (clip.startFrame + clip.durationFrames) / project.animation.fps
    ),
    1
  );
  const frameCount = Math.ceil(durationSeconds * audioSettings.sampleRate);
  const context = new OfflineAudioContext(
    audioSettings.channels,
    frameCount,
    audioSettings.sampleRate
  );

  for (const clip of project.audio.clips) {
    const startTime = clip.startFrame / project.animation.fps;
    const duration = clip.durationFrames / project.animation.fps;
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
    source.start(startTime, 0, duration);
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
