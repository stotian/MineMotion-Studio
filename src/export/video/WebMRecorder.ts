export interface WebMRecording {
  result: Promise<Blob>;
  stop: () => void;
}

export interface CapturedFrameWebMOptions {
  startFrame: number;
  endFrame: number;
  fps: number;
  width: number;
  height: number;
  quality?: "draft" | "medium" | "high";
  captureFrame: (frame: number) => Promise<Blob>;
  isCancelled?: () => boolean;
  onFrame?: (frame: number, index: number, totalFrames: number) => void;
}

export function startCanvasWebMRecording(
  canvas: HTMLCanvasElement,
  fps: number,
  quality: "draft" | "medium" | "high" = "high"
): WebMRecording {
  if (!("captureStream" in canvas) || typeof MediaRecorder === "undefined") {
    throw new Error("WebM recording is not supported in this browser.");
  }
  const stream = canvas.captureStream(fps);
  const chunks: BlobPart[] = [];
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
      videoBitsPerSecond:
        quality === "high" ? 12_000_000 : quality === "medium" ? 7_000_000 : 3_000_000
    });
  } catch (error) {
    stopMediaStream(stream);
    throw error;
  }

  const handleData = (event: BlobEvent): void => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  let settled = false;
  let resolveResult!: (blob: Blob) => void;
  let rejectResult!: (error: Error) => void;
  const cleanup = (): void => {
    recorder.removeEventListener("dataavailable", handleData);
    recorder.removeEventListener("stop", handleStop);
    recorder.removeEventListener("error", handleError);
    stopMediaStream(stream);
  };
  const handleStop = (): void => {
    if (settled) return;
    settled = true;
    cleanup();
    resolveResult(new Blob(chunks, { type: "video/webm" }));
  };
  const handleError = (): void => {
    if (settled) return;
    settled = true;
    cleanup();
    rejectResult(new Error("WebM recorder failed."));
  };
  const result = new Promise<Blob>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });
  recorder.addEventListener("dataavailable", handleData);
  recorder.addEventListener("stop", handleStop);
  recorder.addEventListener("error", handleError);
  try {
    recorder.start();
  } catch (error) {
    settled = true;
    cleanup();
    rejectResult(
      error instanceof Error ? error : new Error("WebM recorder failed to start.")
    );
  }

  return {
    result,
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
    }
  };
}

function stopMediaStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) track.stop();
}

export async function recordCanvasWebM(
  canvas: HTMLCanvasElement,
  durationMs: number,
  fps: number,
  quality: "draft" | "medium" | "high" = "high"
): Promise<Blob> {
  const recording = startCanvasWebMRecording(canvas, fps, quality);
  await new Promise((resolve) => window.setTimeout(resolve, durationMs));
  recording.stop();
  return await recording.result;
}

export async function recordCapturedFramesWebM(
  options: CapturedFrameWebMOptions
): Promise<Blob> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("Captured-frame WebM requires createImageBitmap support.");
  }
  const totalFrames = options.endFrame - options.startFrame + 1;
  if (totalFrames < 1) {
    throw new Error("Captured-frame WebM requires a non-empty frame range.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D WebM presentation context is unavailable.");
  }

  const drawFrame = async (frame: number, index: number): Promise<void> => {
    if (options.isCancelled?.()) {
      throw new Error("WebM export cancelled.");
    }
    const blob = await options.captureFrame(frame);
    const bitmap = await createImageBitmap(blob);
    try {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    } finally {
      bitmap.close();
    }
    options.onFrame?.(frame, index, totalFrames);
  };

  await drawFrame(options.startFrame, 1);
  const recording = startCanvasWebMRecording(
    canvas,
    options.fps,
    options.quality
  );
  const frameDurationMs = 1000 / options.fps;
  try {
    await waitForFrameDuration(frameDurationMs);
    for (
      let frame = options.startFrame + 1, index = 2;
      frame <= options.endFrame;
      frame += 1, index += 1
    ) {
      await drawFrame(frame, index);
      await waitForFrameDuration(frameDurationMs);
    }
  } finally {
    recording.stop();
  }
  return await recording.result;
}

function waitForFrameDuration(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
