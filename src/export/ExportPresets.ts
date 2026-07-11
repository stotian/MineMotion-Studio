import type { ExportSettings } from "./ExportTypes";

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ExportSettings>;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "draft-720p",
    name: "Draft Preview 720p",
    description: "Fast low-resolution preview export.",
    settings: { width: 1280, height: 720, quality: "draft", format: "webm_video" }
  },
  {
    id: "youtube-1080p",
    name: "YouTube 1080p",
    description: "Standard 1920x1080 export.",
    settings: { width: 1920, height: 1080, quality: "high" }
  },
  {
    id: "youtube-1440p",
    name: "YouTube 1440p",
    description: "2560x1440 placeholder preset for high-res output.",
    settings: { width: 2560, height: 1440, quality: "high" }
  },
  {
    id: "vertical-1080x1920",
    name: "Vertical Shorts 1080x1920",
    description: "Vertical social export.",
    settings: { width: 1080, height: 1920, quality: "high" }
  },
  {
    id: "cinematic-235",
    name: "Cinematic 2.35:1 1080p",
    description: "1920x817 cinematic output with letterbox composition.",
    settings: {
      width: 1920,
      height: 817,
      includeCinematicBars: true,
      quality: "high"
    }
  },
  {
    id: "square-1080",
    name: "Square 1080",
    description: "Square social export.",
    settings: { width: 1080, height: 1080, quality: "high" }
  },
  {
    id: "png-sequence-hq",
    name: "High Quality PNG Sequence",
    description: "High quality PNG sequence ZIP.",
    settings: { format: "png_sequence", quality: "high" }
  },
  {
    id: "transparent-png-sequence",
    name: "Transparent PNG Sequence",
    description: "PNG sequence with transparent background where supported.",
    settings: {
      format: "png_sequence",
      transparentBackground: true,
      quality: "high"
    }
  },
  {
    id: "low-file-size-webm",
    name: "Low File Size WebM",
    description: "Browser-compatible 720p WebM preview with draft quality.",
    settings: {
      format: "webm_video",
      width: 1280,
      height: 720,
      quality: "draft",
      includeAudio: false
    }
  }
];
