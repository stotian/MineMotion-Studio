/**
 * Locating a local Minecraft installation.
 *
 * The app ships no Mojang artwork — it cannot lawfully redistribute it. Real
 * block textures therefore come from the user's own copy of the game, the same
 * way Blockbench and similar tools source them: the client jar for a version is
 * a ZIP whose assets/minecraft/textures tree holds every block texture.
 *
 * This module resolves paths and validates a candidate folder. Reading the jar
 * reuses the existing ZIP reader, so nothing new is required to open it.
 */

export type Platform = "windows" | "macos" | "linux";

/** Default .minecraft location for each platform. */
export function defaultInstallPath(platform: Platform, home: string): string {
  switch (platform) {
    case "windows":
      return `${home}\\AppData\\Roaming\\.minecraft`;
    case "macos":
      return `${home}/Library/Application Support/minecraft`;
    default:
      return `${home}/.minecraft`;
  }
}

/** Path to a version's client jar inside an installation. */
export function versionJarPath(installPath: string, version: string): string {
  const separator = installPath.includes("\\") ? "\\" : "/";
  return [installPath, "versions", version, `${version}.jar`].join(separator);
}

export interface InstallCheck {
  ok: boolean;
  /** Versions found under versions/, newest-looking first. */
  versions: string[];
  problems: string[];
}

/**
 * Validates a candidate installation from a listing of its entries.
 *
 * Takes the listing rather than touching the filesystem so this stays testable
 * and works the same whether entries came from Tauri or a directory picker.
 */
export function checkInstall(entries: readonly string[]): InstallCheck {
  const problems: string[] = [];
  const normalized = entries.map((entry) => entry.replace(/\\/g, "/"));

  const versions = [
    ...new Set(
      normalized
        .map((entry) => entry.match(/(?:^|\/)versions\/([^/]+)\//)?.[1])
        .filter((value): value is string => Boolean(value))
    )
  ].sort(compareVersionsDescending);

  if (versions.length === 0) {
    problems.push(
      "No versions/ folder found. Point at the .minecraft folder itself, not a saves or mods folder."
    );
  }

  return { ok: problems.length === 0, versions, problems };
}

/**
 * Orders versions newest-first.
 *
 * Handles both schemes in the wild: date-based ids like "26.2" and the older
 * "1.21.4". Comparing numeric segments left to right works for both, so a
 * future scheme change does not need new code here.
 */
export function compareVersionsDescending(a: string, b: string): number {
  const parse = (value: string) =>
    value.split(/[^\d]+/).filter(Boolean).map(Number);
  const left = parse(a);
  const right = parse(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (right[index] ?? -1) - (left[index] ?? -1);
    if (diff !== 0) return diff;
  }
  return a.localeCompare(b);
}

/** A block texture pulled out of a client jar or resource pack. */
export interface ExtractedTexture {
  /** Namespaced resource location, e.g. "minecraft:block/stone". */
  location: string;
  bytes: Uint8Array;
}

/**
 * Pulls block textures out of jar entries.
 *
 * Only assets/<namespace>/textures/block is taken: item, entity and GUI art is
 * not needed to render a world, and skipping it keeps the import far smaller.
 */
export function extractBlockTextures(
  entries: ReadonlyArray<{ path: string; bytes: Uint8Array }>
): ExtractedTexture[] {
  const textures: ExtractedTexture[] = [];
  for (const entry of entries) {
    const match = entry.path
      .replace(/\\/g, "/")
      .match(/^assets\/([^/]+)\/textures\/(block\/[^/]+)\.png$/i);
    if (!match) continue;
    textures.push({
      location: `${match[1]}:${match[2]}`.toLowerCase(),
      bytes: entry.bytes
    });
  }
  return textures;
}

/** Maps a block id to the texture location its faces use by convention. */
export function defaultTextureLocation(blockId: string): string {
  const [namespace, path] = blockId.includes(":")
    ? blockId.split(":")
    : ["minecraft", blockId];
  return `${namespace}:block/${path}`;
}
