export type ExportFormat =
  | "png_frame"
  | "png_sequence"
  | "webm_video"
  | "mp4_video"
  | "wav_audio"
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
