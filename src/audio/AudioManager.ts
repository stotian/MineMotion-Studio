import { clipGainAtFrame } from "./AudioAnalysis";
import type { AudioClip } from "./AudioTypes";

interface ActiveAudioElement {
  element: HTMLAudioElement;
  clipId: string;
  startedAtFrame: number;
}

export class AudioManager {
  private readonly activeElements = new Map<string, ActiveAudioElement>();
  private audioContext: AudioContext | null = null;

  playClip(clip: AudioClip, sourceOffsetSeconds = 0): void {
    this.stopClip(clip.id);
    if (clip.muted) return;
    if (clip.sourceKind === "imported" && clip.dataUrl) {
      const audio = new Audio(clip.dataUrl);
      audio.volume = Math.max(0, Math.min(1, clip.volume));
      audio.loop = clip.loop;
      audio.currentTime = Math.max(0, sourceOffsetSeconds);
      this.activeElements.set(clip.id, { element: audio, clipId: clip.id, startedAtFrame: clip.startFrame });
      audio.onended = () => this.releaseElement(clip.id, audio);
      void audio.play().catch(() => this.releaseElement(clip.id, audio));
      return;
    }
    this.playPlaceholderTone(clip);
  }

  syncClips(clips: readonly AudioClip[], frame: number, fps: number, isPlaying: boolean): void {
    if (!isPlaying) {
      this.stopAll();
      return;
    }
    const safeFps = Math.max(1, fps);
    const desired = new Set<string>();
    for (const clip of clips) {
      const localFrame = frame - clip.startFrame;
      if (clip.muted || localFrame < 0 || localFrame >= clip.durationFrames) continue;
      desired.add(clip.id);
      const sourceFrame = clip.sourceOffsetFrames + localFrame;
      const sourceSeconds = sourceFrame / safeFps;
      const active = this.activeElements.get(clip.id);
      if (!active) {
        this.playClip(clip, sourceSeconds);
        continue;
      }
      const expectedGain = Math.max(0, Math.min(1, clipGainAtFrame(clip, frame)));
      active.element.volume = expectedGain;
      active.element.loop = clip.loop;
      if (Math.abs(active.element.currentTime - sourceSeconds) > 0.08) {
        active.element.currentTime = sourceSeconds;
      }
    }
    for (const clipId of [...this.activeElements.keys()]) {
      if (!desired.has(clipId)) this.stopClip(clipId);
    }
  }

  stopAll(): void {
    for (const clipId of [...this.activeElements.keys()]) this.stopClip(clipId);
  }

  stopClip(clipId: string): void {
    const active = this.activeElements.get(clipId);
    if (!active) return;
    active.element.onended = null;
    active.element.pause();
    active.element.currentTime = 0;
    active.element.removeAttribute("src");
    active.element.load();
    this.activeElements.delete(clipId);
  }

  async dispose(): Promise<void> {
    this.stopAll();
    const context = this.audioContext;
    this.audioContext = null;
    if (context && context.state !== "closed") await context.close().catch(() => undefined);
  }

  private releaseElement(clipId: string, audio: HTMLAudioElement): void {
    if (this.activeElements.get(clipId)?.element === audio) this.activeElements.delete(clipId);
    audio.onended = null;
    audio.removeAttribute("src");
    audio.load();
  }

  private playPlaceholderTone(clip: AudioClip): void {
    const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextConstructor) return;
    this.audioContext ??= new AudioContextConstructor();
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.frequency.value = clip.name.toLowerCase().includes("boom") ? 62 : clip.name.toLowerCase().includes("whoosh") ? 220 : 140;
    oscillator.type = "sine";
    gain.gain.value = clip.volume * 0.12;
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      oscillator.onended = null;
    };
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.16);
  }
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext; }
}
