import { isOfflineAudioAvailable } from "../../core/capabilities/CapabilityRegistry";

export function isAudioMixdownSupported(): boolean {
  return isOfflineAudioAvailable();
}

export function audioExportStatus(): string {
  return isAudioMixdownSupported()
    ? "WAV mixdown is available for imported audio and generated placeholder SFX."
    : "WAV mixdown needs browser OfflineAudioContext support.";
}
