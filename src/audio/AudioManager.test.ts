import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioManager } from "./AudioManager";
import type { AudioClip } from "./AudioTypes";

function importedClip(): AudioClip {
  return {
    id: "clip",
    name: "Clip",
    sourceKind: "imported",
    sourceName: "clip.wav",
    mimeType: "audio/wav",
    dataUrl: "data:audio/wav;base64,AA==",
    startFrame: 0,
    durationFrames: 24,
    sourceOffsetFrames: 0,
    fadeInFrames: 0,
    fadeOutFrames: 0,
    volume: 1,
    pan: 0,
    muted: false,
    loop: false,
    role: "sfx",
    peak: null,
    integratedLoudnessLufs: null,
    waveformHash: "",
    decodeStatus: "ready",
    importedAt: "2026-07-26T00:00:00.000Z"
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AudioManager resource lifecycle", () => {
  it("releases completed and explicitly stopped media elements", async () => {
    const elements: FakeAudio[] = [];
    vi.stubGlobal("Audio", class {
      constructor() {
        const element = new FakeAudio();
        elements.push(element);
        return element;
      }
    });
    const manager = new AudioManager();

    manager.playClip(importedClip());
    elements[0].onended?.(new Event("ended"));
    manager.playClip(importedClip());

    expect(elements[0].pause).not.toHaveBeenCalled();
    expect(elements[0].removeAttribute).toHaveBeenCalledWith("src");
    expect(elements[0].load).toHaveBeenCalledOnce();
    await manager.dispose();
    expect(elements[1].pause).toHaveBeenCalledOnce();
    expect(elements[1].removeAttribute).toHaveBeenCalledWith("src");
    expect(elements[1].load).toHaveBeenCalledOnce();
  });

  it("disconnects placeholder nodes and closes its audio context", async () => {
    const oscillator = {
      frequency: { value: 0 },
      type: "sine",
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as ((event: Event) => void) | null
    };
    const gain = {
      gain: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn()
    };
    const close = vi.fn(async () => undefined);
    class FakeAudioContext {
      state: AudioContextState = "running";
      currentTime = 0;
      destination = {};
      createOscillator = () => oscillator;
      createGain = () => gain;
      close = close;
    }
    vi.stubGlobal("window", {
      AudioContext: FakeAudioContext,
      webkitAudioContext: undefined
    });
    const manager = new AudioManager();

    manager.playClip({
      ...importedClip(),
      sourceKind: "builtin-placeholder",
      dataUrl: ""
    });
    oscillator.onended?.(new Event("ended"));
    await manager.dispose();

    expect(oscillator.disconnect).toHaveBeenCalledOnce();
    expect(gain.disconnect).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});

class FakeAudio {
  volume = 1;
  loop = false;
  currentTime = 0;
  onended: ((event: Event) => void) | null = null;
  pause = vi.fn();
  play = vi.fn(async () => undefined);
  removeAttribute = vi.fn();
  load = vi.fn();
}
