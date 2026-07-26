import type { AudioClip } from "./AudioTypes";

export class AudioManager {
  private readonly activeElements = new Map<string, HTMLAudioElement>();
  private audioContext: AudioContext | null = null;

  playClip(clip: AudioClip): void {
    this.stopClip(clip.id);

    if (clip.sourceKind === "imported" && clip.dataUrl) {
      const audio = new Audio(clip.dataUrl);
      audio.volume = clip.volume;
      audio.loop = clip.loop;
      this.activeElements.set(clip.id, audio);
      audio.onended = () => {
        if (this.activeElements.get(clip.id) === audio) {
          this.activeElements.delete(clip.id);
        }
        audio.onended = null;
        audio.removeAttribute("src");
        audio.load();
      };
      void audio.play().catch(() => undefined);
      return;
    }

    this.playPlaceholderTone(clip);
  }

  stopAll(): void {
    for (const clipId of this.activeElements.keys()) {
      this.stopClip(clipId);
    }
  }

  stopClip(clipId: string): void {
    const audio = this.activeElements.get(clipId);
    if (!audio) return;
    audio.onended = null;
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
    this.activeElements.delete(clipId);
  }

  async dispose(): Promise<void> {
    this.stopAll();
    const context = this.audioContext;
    this.audioContext = null;
    if (context && context.state !== "closed") {
      await context.close().catch(() => undefined);
    }
  }

  private playPlaceholderTone(clip: AudioClip): void {
    const AudioContextConstructor =
      window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextConstructor) return;
    this.audioContext ??= new AudioContextConstructor();
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.frequency.value = clip.name.toLowerCase().includes("boom")
      ? 62
      : clip.name.toLowerCase().includes("whoosh")
        ? 220
        : 140;
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
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
