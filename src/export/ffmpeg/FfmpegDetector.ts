import { invoke } from "@tauri-apps/api/core";
import type { FfmpegSettings } from "./FfmpegSettings";

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
  return (
    typeof window !== "undefined" &&
    "__TAURI_INTERNALS__" in window
  );
}

export async function detectFfmpeg(
  settings: Pick<FfmpegSettings, "executablePath">
): Promise<FfmpegDetectionResult> {
  if (!isTauriRuntime()) return WEB_FFMPEG_STATUS;

  try {
    return await invoke<FfmpegDetectionResult>("detect_ffmpeg", {
      executable: settings.executablePath || "ffmpeg"
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error || "FFmpeg detection failed.");
    return {
      available: false,
      nativeRuntime: true,
      executable: settings.executablePath || "ffmpeg",
      version: "",
      message
    };
  }
}
