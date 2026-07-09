export async function recordCanvasWebM(
  canvas: HTMLCanvasElement,
  durationMs: number,
  fps: number
): Promise<Blob> {
  if (!("captureStream" in canvas) || typeof MediaRecorder === "undefined") {
    throw new Error("WebM recording is not supported in this browser.");
  }
  const stream = canvas.captureStream(fps);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm"
  });
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  recorder.start();
  await new Promise((resolve) => window.setTimeout(resolve, durationMs));
  recorder.stop();
  await new Promise<void>((resolve) =>
    recorder.addEventListener("stop", () => resolve(), { once: true })
  );
  return new Blob(chunks, { type: "video/webm" });
}
