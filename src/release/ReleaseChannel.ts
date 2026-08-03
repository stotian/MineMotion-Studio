export const RELEASE_CHANNELS = ["development", "beta", "stable"] as const;
export type ReleaseChannel = (typeof RELEASE_CHANNELS)[number];
export interface ReleaseIdentity { channel: ReleaseChannel; version: string; displayVersion: string; }
export function createReleaseIdentity(version: string, channel: ReleaseChannel): ReleaseIdentity {
  const normalized = /^\d+\.\d+\.\d+$/.test(version) ? version : "0.0.0";
  return { channel, version: normalized, displayVersion: channel === "stable" ? normalized : `${normalized}-${channel}` };
}
