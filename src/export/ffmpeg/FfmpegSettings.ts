export type FfmpegVideoQuality = "small" | "balanced" | "high";

export interface FfmpegSettings {
  executablePath: string;
  outputDirectory: string;
  overwriteExisting: boolean;
  videoQuality: FfmpegVideoQuality;
}

export const DEFAULT_FFMPEG_SETTINGS: FfmpegSettings = {
  executablePath: "ffmpeg",
  outputDirectory: "",
  overwriteExisting: false,
  videoQuality: "balanced"
};

export function withFfmpegSettingsDefaults(
  value: Partial<FfmpegSettings> | undefined
): FfmpegSettings {
  const quality = value?.videoQuality;
  return {
    executablePath: value?.executablePath?.trim() || "ffmpeg",
    outputDirectory: value?.outputDirectory?.trim() ?? "",
    overwriteExisting: value?.overwriteExisting === true,
    videoQuality:
      quality === "small" || quality === "high" ? quality : "balanced"
  };
}
