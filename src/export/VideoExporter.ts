import { isWebMRecordingAvailable } from "../core/capabilities/CapabilityRegistry";

export function isWebMExportSupported(): boolean {
  return isWebMRecordingAvailable();
}

export function mp4ExportStatus(): string {
  return "MP4 requires the Tauri desktop runtime and a user-installed FFmpeg executable detected in Production Export.";
}
