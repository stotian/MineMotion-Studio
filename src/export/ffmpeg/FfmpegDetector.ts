import { invoke } from "@tauri-apps/api/core";
import type { FfmpegSettings } from "./FfmpegSettings";
import {
  isTauriRuntimeAvailable,
  updateRuntimeFfmpegCapability
} from "../../core/capabilities/CapabilityRegistry";

export interface FfmpegDetectionResult {
  available: boolean;
  nativeRuntime: boolean;
  executable: string;
  version: string;
  message: string;
}

export const WEB_FFMPEG_STATUS: FfmpegDetectionResult = {
  available: false,
  nativeRuntime: false,
  executable: "",
  version: "",
  message: "FFmpeg export requires the MineMotion Studio desktop app."
};

export function isTauriRuntime(): boolean {
  return isTauriRuntimeAvailable();
}

export async function detectFfmpeg(
  settings: Pick<FfmpegSettings, "executablePath">
): Promise<FfmpegDetectionResult> {
  if (!isTauriRuntime()) {
    updateRuntimeFfmpegCapability(WEB_FFMPEG_STATUS);
    return WEB_FFMPEG_STATUS;
  }

  try {
    const result = await invoke<FfmpegDetectionResult>("detect_ffmpeg", {
      executable: settings.executablePath || "ffmpeg"
    });
    updateRuntimeFfmpegCapability(result);
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error || "FFmpeg detection failed.");
    const result: FfmpegDetectionResult = {
      available: false,
      nativeRuntime: true,
      executable: settings.executablePath || "ffmpeg",
      version: "",
      message
    };
    updateRuntimeFfmpegCapability(result);
    return result;
  }
}
