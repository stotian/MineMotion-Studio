export interface AudioExportSettings {
  sampleRate: number;
  channels: 1 | 2;
}

export const DEFAULT_AUDIO_EXPORT_SETTINGS: AudioExportSettings = {
  sampleRate: 44100,
  channels: 2
};
