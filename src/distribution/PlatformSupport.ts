export type PlatformId = "windows-x64" | "macos-arm64" | "macos-x64" | "linux-x64";
export type PlatformValidationStatus = "unvalidated" | "ci-built" | "smoke-tested" | "supported";
export interface PlatformSupportEntry {
  id: PlatformId;
  operatingSystem: string;
  minimumVersion: string;
  artifactTargets: string[];
  requiredSmokeTests: string[];
  status: PlatformValidationStatus;
  supportClaimed: boolean;
  limitations: string[];
}
export const PLATFORM_SUPPORT_MATRIX: PlatformSupportEntry[] = [
  { id: "windows-x64", operatingSystem: "Windows", minimumVersion: "Windows 10 22H2", artifactTargets: ["msi", "nsis"], requiredSmokeTests: ["install", "upgrade", "uninstall", "file-association", "open-save", "recovery", "ffmpeg"], status: "unvalidated", supportClaimed: false, limitations: ["Requires a signed installer smoke test before support may be claimed."] },
  { id: "macos-arm64", operatingSystem: "macOS Apple Silicon", minimumVersion: "macOS 13", artifactTargets: ["dmg", "app"], requiredSmokeTests: ["install", "upgrade", "uninstall", "file-association", "open-save", "recovery", "notarization"], status: "unvalidated", supportClaimed: false, limitations: ["Requires signing and notarization on protected infrastructure."] },
  { id: "macos-x64", operatingSystem: "macOS Intel", minimumVersion: "macOS 13", artifactTargets: ["dmg", "app"], requiredSmokeTests: ["install", "upgrade", "uninstall", "file-association", "open-save", "recovery", "notarization"], status: "unvalidated", supportClaimed: false, limitations: ["Requires a real Intel runner or hardware smoke test."] },
  { id: "linux-x64", operatingSystem: "Linux", minimumVersion: "Ubuntu 22.04 LTS or compatible", artifactTargets: ["appimage", "deb"], requiredSmokeTests: ["install", "uninstall", "open-save", "recovery", "ffmpeg", "wayland-x11"], status: "unvalidated", supportClaimed: false, limitations: ["Desktop integration varies by distribution and compositor."] }
];
export function claimedPlatforms(): PlatformSupportEntry[] { return PLATFORM_SUPPORT_MATRIX.filter((entry) => entry.supportClaimed && entry.status === "supported"); }
export function validatePlatformClaim(entry: PlatformSupportEntry): string[] {
  const errors: string[] = [];
  if (entry.supportClaimed && entry.status !== "supported") errors.push(`${entry.id} is claimed without supported status.`);
  if (entry.status === "supported" && entry.requiredSmokeTests.length === 0) errors.push(`${entry.id} has no smoke-test contract.`);
  return errors;
}
