import type { LocalizationService } from "./LocalizationService";
import type { TranslationKey } from "./LocalizationTypes";

const EXPORT_MESSAGE_MAP: Readonly<Record<string, readonly [string, TranslationKey]>> = Object.freeze({
  "No active/export camera is available.": ["EXPORT_CAMERA_MISSING", "export.issue.cameraMissing"],
  "Start frame must be before or equal to end frame.": ["EXPORT_FRAME_ORDER_INVALID", "export.issue.frameOrder"],
  "Frame range must contain at least one frame.": ["EXPORT_FRAME_RANGE_EMPTY", "export.issue.frameEmpty"],
  "End frame is beyond project duration and will hold the last scene state.": ["EXPORT_END_AFTER_PROJECT", "export.issue.endAfterProject"],
  "Choose an FFmpeg output directory before starting a native export.": ["EXPORT_DIRECTORY_MISSING", "export.issue.directoryMissing"],
  "Output name is required.": ["EXPORT_NAME_MISSING", "export.issue.nameMissing"],
  "WebM export requires browser image bitmap, MediaRecorder, and canvas capture support.": ["EXPORT_WEBM_UNSUPPORTED", "export.issue.webmUnsupported"],
  "Browser WebM export records video only; export WAV separately or use native MP4 for muxed audio.": ["EXPORT_WEBM_VIDEO_ONLY", "export.issue.webmVideoOnly"],
  "WAV mixdown requires browser OfflineAudioContext support.": ["EXPORT_WAV_UNSUPPORTED", "export.issue.wavUnsupported"],
  "Native video audio muxing requires WAV mixdown support.": ["EXPORT_MUX_UNSUPPORTED", "export.issue.muxUnsupported"],
  "MP3 export requires WAV mixdown support before FFmpeg encoding.": ["EXPORT_MP3_MIXDOWN_UNSUPPORTED", "export.issue.mp3MixdownUnsupported"],
  "MP3 export is FFmpeg-only; browser mode will not fake it.": ["EXPORT_MP3_NATIVE_ONLY", "export.issue.mp3NativeOnly"],
  "Resolution is above 4K and may be slow in browser export.": ["EXPORT_RESOLUTION_HIGH", "export.issue.resolutionHigh"],
  "Estimated output size is above 2 GB.": ["EXPORT_SIZE_HIGH", "export.issue.sizeHigh"],
  "Post-processing is requested but disabled in project settings.": ["EXPORT_POST_DISABLED", "export.issue.postDisabled"],
  "VFX export is enabled but the project has no effect instances.": ["EXPORT_VFX_EMPTY", "export.issue.vfxEmpty"]
});

export function localizeExportValidationMessage(
  localization: LocalizationService,
  message: string
): string {
  const known = EXPORT_MESSAGE_MAP[message];
  if (known) return `[${known[0]}] ${localization.t(known[1])}`;
  const nativeFormat = /^(.*?) requires native FFmpeg support\.$/.exec(message);
  if (nativeFormat) {
    return `[EXPORT_FFMPEG_REQUIRED] ${localization.t("export.issue.ffmpegRequired", { format: nativeFormat[1] })}`;
  }
  const missingAssets = /^(\d+) tracked assets are missing or invalid\.$/.exec(message);
  if (missingAssets) {
    return `[EXPORT_ASSETS_MISSING] ${localization.t("export.issue.assetsMissing", {
      count: localization.formatNumber(Number(missingAssets[1]))
    })}`;
  }
  return `[EXPORT_DIAGNOSTIC_UNMAPPED] ${localization.t("export.issue.unmapped")}`;
}
