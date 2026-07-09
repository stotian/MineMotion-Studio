export function isAudioMixdownSupported(): boolean {
  return typeof OfflineAudioContext !== "undefined";
}

export function audioExportStatus(): string {
  return isAudioMixdownSupported()
    ? "WAV mixdown is available for imported audio and generated placeholder SFX."
    : "WAV mixdown needs browser OfflineAudioContext support.";
}
