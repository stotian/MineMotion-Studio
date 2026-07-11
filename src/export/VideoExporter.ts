export function isWebMExportSupported(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
  );
}

export function mp4ExportStatus(): string {
  return "MP4 requires the Tauri desktop runtime and a user-installed FFmpeg executable detected in Production Export.";
}
