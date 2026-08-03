import { createSimpleHash } from "../assets/library/AssetHash";

export interface AudioWaveform {
  hash: string;
  sampleRate: number;
  durationSeconds: number;
  peaks: number[];
  peak: number;
  rms: number;
}

export interface AudioWaveformCache {
  get(hash: string): Promise<AudioWaveform | null>;
  set(waveform: AudioWaveform): Promise<void>;
}

export class MemoryAudioWaveformCache implements AudioWaveformCache {
  private readonly entries = new Map<string, AudioWaveform>();
  constructor(private readonly maximumEntries = 128) {}
  async get(hash: string): Promise<AudioWaveform | null> {
    const waveform = this.entries.get(hash) ?? null;
    if (waveform) {
      this.entries.delete(hash);
      this.entries.set(hash, waveform);
    }
    return waveform;
  }
  async set(waveform: AudioWaveform): Promise<void> {
    this.entries.delete(waveform.hash);
    this.entries.set(waveform.hash, waveform);
    while (this.entries.size > this.maximumEntries) {
      const first = this.entries.keys().next().value as string | undefined;
      if (!first) break;
      this.entries.delete(first);
    }
  }
}

export async function buildAudioWaveform(
  channelData: readonly Float32Array[],
  sampleRate: number,
  bucketCount = 512,
  signal?: AbortSignal
): Promise<AudioWaveform> {
  if (channelData.length === 0) throw new Error("Waveform generation requires at least one channel.");
  const frameCount = Math.max(...channelData.map((channel) => channel.length));
  const buckets = Math.max(16, Math.min(4096, Math.round(bucketCount)));
  const peaks = new Array<number>(buckets).fill(0);
  let absolutePeak = 0;
  let squaredSum = 0;
  let sampleCount = 0;
  const stride = Math.max(1, Math.ceil(frameCount / buckets));
  for (let frame = 0; frame < frameCount; frame += 1) {
    if ((frame & 0x3fff) === 0) {
      if (signal?.aborted) throw new DOMException("Waveform generation cancelled.", "AbortError");
      await Promise.resolve();
    }
    let mixed = 0;
    for (const channel of channelData) mixed += channel[frame] ?? 0;
    mixed /= channelData.length;
    const amplitude = Math.abs(mixed);
    absolutePeak = Math.max(absolutePeak, amplitude);
    squaredSum += mixed * mixed;
    sampleCount += 1;
    peaks[Math.min(buckets - 1, Math.floor(frame / stride))] = Math.max(peaks[Math.min(buckets - 1, Math.floor(frame / stride))], amplitude);
  }
  const signature = `${sampleRate}:${frameCount}:${peaks.map((value) => value.toFixed(4)).join(",")}`;
  return {
    hash: createSimpleHash(signature),
    sampleRate,
    durationSeconds: frameCount / Math.max(1, sampleRate),
    peaks,
    peak: absolutePeak,
    rms: Math.sqrt(squaredSum / Math.max(1, sampleCount))
  };
}

export async function getOrBuildWaveform(
  cache: AudioWaveformCache,
  cacheKey: string,
  channelData: readonly Float32Array[],
  sampleRate: number,
  bucketCount = 512,
  signal?: AbortSignal
): Promise<AudioWaveform> {
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  const waveform = await buildAudioWaveform(channelData, sampleRate, bucketCount, signal);
  const keyed = { ...waveform, hash: cacheKey || waveform.hash };
  await cache.set(keyed);
  return keyed;
}
