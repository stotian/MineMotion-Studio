import type { PlatformId } from "./PlatformSupport";
export interface RuntimeEnvironment { platform: PlatformId; pathSeparator: "/" | "\\"; caseSensitive: boolean; ffmpegExecutableNames: string[]; nativeDialogs: boolean; }
export const RUNTIME_ENVIRONMENTS: Record<PlatformId, RuntimeEnvironment> = {
  "windows-x64": { platform: "windows-x64", pathSeparator: "\\", caseSensitive: false, ffmpegExecutableNames: ["ffmpeg.exe"], nativeDialogs: true },
  "macos-arm64": { platform: "macos-arm64", pathSeparator: "/", caseSensitive: false, ffmpegExecutableNames: ["ffmpeg"], nativeDialogs: true },
  "macos-x64": { platform: "macos-x64", pathSeparator: "/", caseSensitive: false, ffmpegExecutableNames: ["ffmpeg"], nativeDialogs: true },
  "linux-x64": { platform: "linux-x64", pathSeparator: "/", caseSensitive: true, ffmpegExecutableNames: ["ffmpeg"], nativeDialogs: true }
};
export function normalizePortableRelativePath(value: string): string {
  const normalized = value.trim().replace(/\\+/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || /^[a-z]:\//i.test(normalized) || normalized.split("/").includes("..")) throw new Error("Path must be a portable relative path.");
  return normalized.split("/").filter(Boolean).join("/");
}
export function portableFilename(value: string): string {
  const cleaned = value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "");
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(cleaned);
  return (reserved ? `_${cleaned}` : cleaned || "untitled").slice(0, 180);
}
export function codecAvailability(platform: PlatformId, nativeFfmpegAvailable: boolean): Record<string, boolean> {
  return { png: true, wav: true, webm: nativeFfmpegAvailable, mp4: nativeFfmpegAvailable && platform !== "linux-x64" };
}
