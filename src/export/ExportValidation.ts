import { collectProjectAssets } from "../assets/library/AssetLibrary";
import { isAudioMixdownSupported } from "../audio/export/AudioExportSupport";
import type { MineMotionProject } from "../project/ProjectFile";
import type {
  ExportEstimate,
  ExportSettings,
  ExportValidationChecklist,
  ExportValidationResult
} from "./ExportTypes";
import { isWebMExportSupported } from "./VideoExporter";

const NATIVE_FORMATS = new Set<ExportSettings["format"]>([
  "mp4_video",
  "mp4_h264",
  "mp4_h265",
  "prores_video",
  "mp3_audio"
]);

export function validateProductionExport(
  settings: ExportSettings,
  project: MineMotionProject,
  capabilities: ExportCapabilities = {}
): ExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const assetLibrary = collectProjectAssets(project);
  const frameCount = Math.max(0, settings.endFrame - settings.startFrame + 1);
  const durationSeconds = frameCount / Math.max(1, settings.fps);
  const estimatedSizeBytes = estimateOutputSize(settings, frameCount);
  const missingAssets = assetLibrary.records.filter((asset) => asset.missing);
  const activeCameraExists = project.scene.cameras.some(
    (camera) => camera.id === project.activeCameraId
  );
  const hasCamera =
    settings.cameraId === "viewport" ||
    (settings.cameraId === "active"
      ? activeCameraExists
      : project.scene.cameras.some((camera) => camera.id === settings.cameraId));
  const nativeFormat = NATIVE_FORMATS.has(settings.format);
  const baseFormatSupported = isFormatSupported(
    settings.format,
    capabilities.ffmpegAvailable === true
  );
  const mixdownSupported = isAudioMixdownSupported();
  const formatSupported =
    baseFormatSupported &&
    (settings.format !== "webm_video" || isWebMExportSupported()) &&
    (settings.format !== "wav_audio" || mixdownSupported);
  const audioSupported = getAudioSupport(
    settings,
    mixdownSupported,
    capabilities.ffmpegAvailable === true
  );

  if (!hasCamera) errors.push("No active/export camera is available.");
  if (settings.startFrame > settings.endFrame) {
    errors.push("Start frame must be before or equal to end frame.");
  }
  if (frameCount <= 0) errors.push("Frame range must contain at least one frame.");
  if (settings.endFrame > project.animation.durationFrames) {
    warnings.push("End frame is beyond project duration and will hold the last scene state.");
  }
  if (!baseFormatSupported) {
    errors.push(`${formatLabel(settings.format)} requires native FFmpeg support.`);
  }
  if (nativeFormat && !capabilities.ffmpegOutputDirectory?.trim()) {
    errors.push("Choose an FFmpeg output directory before starting a native export.");
  }
  if (!settings.outputName.trim()) errors.push("Output name is required.");
  if (settings.format === "webm_video" && !isWebMExportSupported()) {
    errors.push(
      "WebM export requires browser image bitmap, MediaRecorder, and canvas capture support."
    );
  }
  if (settings.format === "webm_video" && settings.includeAudio) {
    warnings.push(
      "Browser WebM export records video only; export WAV separately or use native MP4 for muxed audio."
    );
  }
  if (settings.format === "wav_audio" && !mixdownSupported) {
    errors.push("WAV mixdown requires browser OfflineAudioContext support.");
  }
  if (
    nativeFormat &&
    settings.includeAudio &&
    settings.format !== "mp3_audio" &&
    !mixdownSupported
  ) {
    errors.push("Native video audio muxing requires WAV mixdown support.");
  }
  if (settings.format === "mp3_audio" && !mixdownSupported) {
    errors.push("MP3 export requires WAV mixdown support before FFmpeg encoding.");
  }
  if (settings.format === "mp3_audio") {
    warnings.push("MP3 export is FFmpeg-only; browser mode will not fake it.");
  }
  if (missingAssets.length > 0) {
    warnings.push(`${missingAssets.length} tracked assets are missing or invalid.`);
  }
  if (settings.width * settings.height > 3840 * 2160) {
    warnings.push("Resolution is above 4K and may be slow in browser export.");
  }
  if (estimatedSizeBytes > 2_000_000_000) {
    warnings.push("Estimated output size is above 2 GB.");
  }
  if (settings.includePostProcessing && !project.postProcessing.enabled) {
    warnings.push("Post-processing is requested but disabled in project settings.");
  }
  if (settings.includeVfx && project.effects.instances.length === 0) {
    warnings.push("VFX export is enabled but the project has no effect instances.");
  }

  const checklist: ExportValidationChecklist = {
    activeCamera: hasCamera,
    frameRange: settings.startFrame <= settings.endFrame,
    outputFormat: formatSupported,
    missingAssets: missingAssets.length === 0,
    audioSupport: audioSupported,
    frameCount: frameCount > 0,
    outputSize: estimatedSizeBytes <= 2_000_000_000,
    postProcessing: !settings.includePostProcessing || project.postProcessing.enabled,
    effects: !settings.includeVfx || project.effects.instances.length > 0
  };
  const estimates: ExportEstimate = {
    frameCount,
    durationSeconds,
    estimatedSizeBytes
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checklist,
    estimates
  };
}

export interface ExportCapabilities {
  ffmpegAvailable?: boolean;
  ffmpegOutputDirectory?: string;
}

export function isFormatSupported(
  format: ExportSettings["format"],
  ffmpegAvailable = false
): boolean {
  return !NATIVE_FORMATS.has(format) || ffmpegAvailable;
}

export function formatLabel(format: ExportSettings["format"]): string {
  const labels: Record<ExportSettings["format"], string> = {
    png_frame: "PNG current frame",
    png_sequence: "PNG sequence ZIP",
    webm_video: "WebM video",
    mp4_video: "MP4 H.264",
    mp4_h264: "MP4 H.264",
    mp4_h265: "MP4 H.265",
    prores_video: "ProRes",
    wav_audio: "WAV audio",
    mp3_audio: "MP3 audio",
    minemotion_package: ".minemotion package",
    audio_metadata: "Audio metadata"
  };
  return labels[format];
}

function estimateOutputSize(settings: ExportSettings, frameCount: number): number {
  const pixels = settings.width * settings.height;
  if (settings.format === "png_frame") return pixels * 4 * 0.35;
  if (settings.format === "png_sequence") return pixels * 4 * 0.35 * frameCount;
  if (settings.format === "wav_audio") {
    return (frameCount / Math.max(1, settings.fps)) * 44100 * 2 * 2;
  }
  if (settings.format === "webm_video") return pixels * frameCount * 0.08;
  if (settings.format === "mp3_audio") {
    return (frameCount / Math.max(1, settings.fps)) * 24_000;
  }
  if (settings.format === "minemotion_package") return 2_000_000;
  if (settings.format === "audio_metadata") return 32_000;
  return pixels * frameCount * 0.12;
}

function getAudioSupport(
  settings: ExportSettings,
  mixdownSupported: boolean,
  ffmpegAvailable: boolean
): boolean {
  if (!settings.includeAudio) return true;
  if (settings.format === "webm_video") return false;
  if (settings.format === "wav_audio") return mixdownSupported;
  if (settings.format === "mp3_audio") return ffmpegAvailable && mixdownSupported;
  if (NATIVE_FORMATS.has(settings.format)) {
    return ffmpegAvailable && mixdownSupported;
  }
  return true;
}
