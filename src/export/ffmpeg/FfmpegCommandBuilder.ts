import { sanitizeOutputName } from "../ExportSettings";
import type { ExportFormat, ExportSettings } from "../ExportTypes";
import type { FfmpegSettings } from "./FfmpegSettings";

export type NativeExportFormat =
  | "mp4_video"
  | "mp4_h264"
  | "mp4_h265"
  | "prores_video"
  | "mp3_audio";

export interface FfmpegCommandPlan {
  executable: string;
  args: string[];
  outputPath: string;
  outputFilename: string;
  format: NativeExportFormat;
}

export function isNativeExportFormat(
  format: ExportFormat
): format is NativeExportFormat {
  return [
    "mp4_video",
    "mp4_h264",
    "mp4_h265",
    "prores_video",
    "mp3_audio"
  ].includes(format);
}

export function buildFfmpegCommand(options: {
  exportSettings: ExportSettings;
  ffmpegSettings: FfmpegSettings;
  audioAvailable: boolean;
}): FfmpegCommandPlan {
  const { exportSettings, ffmpegSettings, audioAvailable } = options;
  if (!isNativeExportFormat(exportSettings.format)) {
    throw new Error(`Format ${exportSettings.format} is not an FFmpeg target.`);
  }
  if (!ffmpegSettings.outputDirectory.trim()) {
    throw new Error("An FFmpeg output directory is required.");
  }

  const format = exportSettings.format;
  const extension = format === "prores_video" ? "mov" : format === "mp3_audio" ? "mp3" : "mp4";
  const outputFilename = `${sanitizeOutputName(exportSettings.outputName)}.${extension}`;
  const outputPath = joinOutputPath(ffmpegSettings.outputDirectory, outputFilename);
  const args = [
    ffmpegSettings.overwriteExisting ? "-y" : "-n",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-stats"
  ];

  if (format === "mp3_audio") {
    args.push("-i", "audio.wav", "-vn", "-codec:a", "libmp3lame", "-q:a", "2", outputPath);
    return {
      executable: ffmpegSettings.executablePath,
      args,
      outputPath,
      outputFilename,
      format
    };
  }

  args.push(
    "-framerate",
    String(exportSettings.fps),
    "-start_number",
    "1",
    "-i",
    "frame_%06d.png"
  );

  if (audioAvailable && exportSettings.includeAudio) {
    args.push("-i", "audio.wav", "-c:a", "aac", "-b:a", "192k", "-shortest");
  } else {
    args.push("-an");
  }

  if (format === "mp4_h265") {
    args.push(
      "-c:v",
      "libx265",
      "-preset",
      presetForQuality(ffmpegSettings.videoQuality),
      "-crf",
      crfForQuality(ffmpegSettings.videoQuality, true),
      "-tag:v",
      "hvc1",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart"
    );
  } else if (format === "prores_video") {
    args.push(
      "-c:v",
      "prores_ks",
      "-profile:v",
      ffmpegSettings.videoQuality === "high" ? "4" : "3",
      "-pix_fmt",
      "yuv422p10le"
    );
  } else {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      presetForQuality(ffmpegSettings.videoQuality),
      "-crf",
      crfForQuality(ffmpegSettings.videoQuality, false),
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart"
    );
  }

  args.push(outputPath);
  return {
    executable: ffmpegSettings.executablePath,
    args,
    outputPath,
    outputFilename,
    format
  };
}

function presetForQuality(quality: FfmpegSettings["videoQuality"]): string {
  if (quality === "high") return "slow";
  if (quality === "small") return "fast";
  return "medium";
}

function crfForQuality(
  quality: FfmpegSettings["videoQuality"],
  h265: boolean
): string {
  if (quality === "high") return h265 ? "20" : "18";
  if (quality === "small") return h265 ? "30" : "28";
  return h265 ? "25" : "23";
}

function joinOutputPath(directory: string, filename: string): string {
  const cleanDirectory = directory.replace(/[\\/]+$/, "");
  const separator = cleanDirectory.includes("\\") ? "\\" : "/";
  return `${cleanDirectory}${separator}${filename}`;
}
