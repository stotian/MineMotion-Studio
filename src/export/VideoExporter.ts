export function isWebMExportSupported(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
  );
}

export function mp4ExportStatus(): string {
  return "MP4 export requires a future FFmpeg/native pipeline. Browser mode exports PNG sequences and can support WebM where MediaRecorder is available.";
}
