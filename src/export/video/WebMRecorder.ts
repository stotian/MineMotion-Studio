export interface WebMRecording {
  result: Promise<Blob>;
  stop: () => void;
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
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm",
    videoBitsPerSecond:
      quality === "high" ? 12_000_000 : quality === "medium" ? 7_000_000 : 3_000_000
  });
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  const result = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener(
      "stop",
      () => {
        for (const track of stream.getTracks()) track.stop();
        resolve(new Blob(chunks, { type: "video/webm" }));
      },
      { once: true }
    );
    recorder.addEventListener(
      "error",
      () => reject(new Error("WebM recorder failed.")),
      { once: true }
    );
  });
  recorder.start();

  return {
    result,
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
    }
  };
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
