export type ExportFormat =
  | "png_frame"
  | "png_sequence"
  | "webm_video"
  | "mp4_video"
  | "mp4_h264"
  | "mp4_h265"
  | "prores_video"
  | "wav_audio"
  | "mp3_audio"
  | "minemotion_package"
  | "audio_metadata";

export type ExportQuality = "draft" | "medium" | "high";

export interface ExportSettings {
  format: ExportFormat;
  startFrame: number;
  endFrame: number;
  fps: number;
  width: number;
  height: number;
  transparentBackground: boolean;
  includePostProcessing: boolean;
  includeVfx: boolean;
  includeCinematicBars: boolean;
  includeAudio: boolean;
  cameraId: "active" | "viewport" | string;
  quality: ExportQuality;
  outputName: string;
}

export interface ExportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checklist?: ExportValidationChecklist;
  estimates?: ExportEstimate;
}

export interface ExportValidationChecklist {
  activeCamera: boolean;
  frameRange: boolean;
  outputFormat: boolean;
  missingAssets: boolean;
  audioSupport: boolean;
  frameCount: boolean;
  outputSize: boolean;
  postProcessing: boolean;
  effects: boolean;
}

export interface ExportEstimate {
  frameCount: number;
  durationSeconds: number;
  estimatedSizeBytes: number;
}

export type ExportStatus =
  | "idle"
  | "preparing"
  | "rendering"
  | "encoding"
  | "complete"
  | "cancelled"
  | "error";

export interface ExportProgressState {
  status: ExportStatus;
  currentFrame: number;
  totalFrames: number;
  message: string;
  error: string;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  warnings: string[];
}
