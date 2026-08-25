/**
 * Minecraft versions and mod loaders a project can target.
 *
 * Minecraft moved to date-based versioning: "26.2" is the second release of
 * 2026 ("Chaos Cubed", 16 June 2026), not a 1.x number. Versions are listed
 * as data so a newer one is a one-line addition rather than a code change.
 */

export type ModLoaderId = "vanilla" | "fabric" | "forge" | "neoforge";

export interface MinecraftVersion {
  /** Registry id, as the launcher shows it. */
  id: string;
  label: string;
  /** Release name, where the version has one. */
  codename?: string;
  releasedOn: string;
  /** Loaders known to have builds for this version. */
  loaders: readonly ModLoaderId[];
}

export const MINECRAFT_VERSIONS: readonly MinecraftVersion[] = Object.freeze([
  {
    id: "26.2",
    label: "26.2",
    codename: "Chaos Cubed",
    releasedOn: "2026-06-16",
    loaders: ["vanilla", "fabric", "forge", "neoforge"]
  },
  {
    id: "26.1",
    label: "26.1",
    releasedOn: "2026-02-25",
    loaders: ["vanilla", "fabric", "forge", "neoforge"]
  },
  {
    id: "1.21",
    label: "1.21",
    codename: "Tricky Trials",
    releasedOn: "2024-06-13",
    loaders: ["vanilla", "fabric", "forge", "neoforge"]
  }
]);

/** What a new project targets unless the user picks otherwise. */
export const DEFAULT_MINECRAFT_VERSION = "26.2";
export const DEFAULT_MOD_LOADER: ModLoaderId = "vanilla";

export interface ModLoaderInfo {
  id: ModLoaderId;
  label: string;
  /** Manifest a mod for this loader carries, used to identify imported jars. */
  manifest: string | null;
}

export const MOD_LOADERS: readonly ModLoaderInfo[] = Object.freeze([
  { id: "vanilla", label: "Vanilla", manifest: null },
  { id: "fabric", label: "Fabric", manifest: "fabric.mod.json" },
  { id: "forge", label: "Forge", manifest: "META-INF/mods.toml" },
  { id: "neoforge", label: "NeoForge", manifest: "META-INF/neoforge.mods.toml" }
]);

export function getMinecraftVersion(id: string): MinecraftVersion | null {
  return MINECRAFT_VERSIONS.find((version) => version.id === id) ?? null;
}

/** True when the loader has builds for that version. */
export function loaderSupportsVersion(loader: ModLoaderId, versionId: string): boolean {
  return getMinecraftVersion(versionId)?.loaders.includes(loader) ?? false;
}
