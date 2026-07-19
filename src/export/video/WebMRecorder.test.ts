import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordCapturedFramesWebM } from "./WebMRecorder";

type Listener = (event: { data: Blob }) => void;

class FakeMediaRecorder {
  static isTypeSupported(): boolean {
    return true;
  }

  state: "inactive" | "recording" = "inactive";
  private readonly listeners = new Map<string, Listener[]>();

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  start(): void {
    this.state = "recording";
  }

  stop(): void {
    if (this.state === "inactive") return;
    this.state = "inactive";
    for (const listener of this.listeners.get("dataavailable") ?? []) {
      listener({ data: new Blob(["webm-frame"]) });
    }
    for (const listener of this.listeners.get("stop") ?? []) {
      listener({ data: new Blob() });
    }
  }
}

describe("recordCapturedFramesWebM", () => {
  const drawImage = vi.fn();
  const clearRect = vi.fn();
  const closeBitmap = vi.fn();
  const stopTrack = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("createImageBitmap", async () => ({ close: closeBitmap }));
    vi.stubGlobal("window", { setTimeout: (callback: () => void) => callback() });
    vi.stubGlobal("document", {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({ clearRect, drawImage }),
        captureStream: () => ({ getTracks: () => [{ stop: stopTrack }] })
      })
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("records the same ordered captured-frame presentation used by PNG export", async () => {
    const captured: number[] = [];
    const presented: number[] = [];
    const blob = await recordCapturedFramesWebM({
      startFrame: 4,
      endFrame: 6,
      fps: 24,
      width: 1280,
      height: 720,
      captureFrame: async (frame) => {
        captured.push(frame);
        return new Blob([String(frame)], { type: "image/png" });
      },
      onFrame: (frame) => presented.push(frame)
    });

    expect(captured).toEqual([4, 5, 6]);
    expect(presented).toEqual(captured);
    expect(drawImage).toHaveBeenCalledTimes(3);
    expect(closeBitmap).toHaveBeenCalledTimes(3);
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(blob.type).toBe("video/webm");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("stops recorder resources when cancellation interrupts the frame loop", async () => {
    let captures = 0;
    await expect(
      recordCapturedFramesWebM({
        startFrame: 1,
        endFrame: 3,
        fps: 24,
        width: 320,
        height: 180,
        captureFrame: async () => {
          captures += 1;
          return new Blob(["frame"], { type: "image/png" });
        },
        isCancelled: () => captures >= 1
      })
    ).rejects.toThrow(/cancelled/i);

    expect(captures).toBe(1);
    expect(stopTrack).toHaveBeenCalledOnce();
  });
});
