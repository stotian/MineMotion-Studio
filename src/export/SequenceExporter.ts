import { sanitizeOutputName } from "./ExportSettings";
import type { ExportProgressState, ExportResult, ExportSettings } from "./ExportTypes";
import { createStoredZip } from "./ZipWriter";

export async function exportPngSequenceZip(options: {
  settings: ExportSettings;
  captureFrame: (frame: number) => Promise<Blob>;
  onProgress: (progress: ExportProgressState) => void;
  isCancelled: () => boolean;
}): Promise<ExportResult> {
  const { settings, captureFrame, onProgress, isCancelled } = options;
  const totalFrames = settings.endFrame - settings.startFrame + 1;
  const entries: Array<{ filename: string; data: Uint8Array }> = [];

  for (
    let frame = settings.startFrame, index = 0;
    frame <= settings.endFrame;
    frame += 1, index += 1
  ) {
    if (isCancelled()) {
      throw new Error("Export cancelled.");
    }
    onProgress({
      status: "rendering",
      currentFrame: index + 1,
      totalFrames,
      message: `Rendering frame ${index + 1} of ${totalFrames}`,
      error: ""
    });
    const blob = await captureFrame(frame);
    entries.push({
      filename: `${sanitizeOutputName(settings.outputName)}_${String(index + 1).padStart(6, "0")}.png`,
      data: new Uint8Array(await blob.arrayBuffer())
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }

  onProgress({
    status: "encoding",
    currentFrame: totalFrames,
    totalFrames,
    message: "Packaging PNG sequence ZIP.",
    error: ""
  });

  return {
    blob: createStoredZip(entries),
    filename: `${sanitizeOutputName(settings.outputName)}_png_sequence.zip`,
    mimeType: "application/zip",
    warnings: []
  };
}
