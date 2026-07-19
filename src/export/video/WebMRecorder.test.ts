import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  recordCapturedFramesWebM,
  startCanvasWebMRecording
} from "./WebMRecorder";

type Listener = (event: { data: Blob }) => void;

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static failConstruction = false;
  static failStart = false;

  static isTypeSupported(): boolean {
    return true;
  }

  state: "inactive" | "recording" = "inactive";
  private readonly listeners = new Map<string, Listener[]>();

  constructor() {
    if (FakeMediaRecorder.failConstruction) {
      throw new Error("constructor failed");
    }
    FakeMediaRecorder.instances.push(this);
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((candidate) => candidate !== listener)
    );
  }

  listenerCount(): number {
    return Array.from(this.listeners.values()).reduce(
      (total, listeners) => total + listeners.length,
      0
    );
  }

  fail(): void {
    for (const listener of this.listeners.get("error") ?? []) {
      listener({ data: new Blob() });
    }
  }

  start(): void {
    if (FakeMediaRecorder.failStart) throw new Error("start failed");
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
    FakeMediaRecorder.instances = [];
    FakeMediaRecorder.failConstruction = false;
    FakeMediaRecorder.failStart = false;
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
    expect(FakeMediaRecorder.instances[0].listenerCount()).toBe(0);
  });

  it("releases every bitmap, track, and listener across retry cycles", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await recordCapturedFramesWebM({
        startFrame: 1,
        endFrame: 2,
        fps: 24,
        width: 320,
        height: 180,
        captureFrame: async () => new Blob(["frame"], { type: "image/png" })
      });
    }

    expect(closeBitmap).toHaveBeenCalledTimes(6);
    expect(stopTrack).toHaveBeenCalledTimes(3);
    expect(FakeMediaRecorder.instances).toHaveLength(3);
    expect(
      FakeMediaRecorder.instances.every((recorder) => recorder.listenerCount() === 0)
    ).toBe(true);
  });

  it("stops tracks and removes listeners when the recorder errors", async () => {
    const canvas = document.createElement("canvas");
    const recording = startCanvasWebMRecording(canvas, 24);
    FakeMediaRecorder.instances[0].fail();

    await expect(recording.result).rejects.toThrow(/failed/i);
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(FakeMediaRecorder.instances[0].listenerCount()).toBe(0);
  });

  it("releases the stream when recorder construction or startup fails", async () => {
    const canvas = document.createElement("canvas");
    FakeMediaRecorder.failConstruction = true;
    expect(() => startCanvasWebMRecording(canvas, 24)).toThrow(
      /constructor failed/i
    );
    expect(stopTrack).toHaveBeenCalledOnce();

    FakeMediaRecorder.failConstruction = false;
    FakeMediaRecorder.failStart = true;
    const recording = startCanvasWebMRecording(canvas, 24);
    await expect(recording.result).rejects.toThrow(/start failed/i);
    expect(stopTrack).toHaveBeenCalledTimes(2);
    expect(FakeMediaRecorder.instances[0].listenerCount()).toBe(0);
  });
});
