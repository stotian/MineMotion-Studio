import {
  registerBlockSource,
  registerBlocks,
  unregisterNamespace
} from "../blocks/BlockRegistry";
import { readZipEntries } from "../resources/ResourcePackImporter";
import { readModContents, type ModContents, type ModMetadata } from "./ModJarReader";

/**
 * Installed mods, and the bridge that puts their blocks into the registry.
 *
 * Kept separate from the reader so importing a jar and registering its contents
 * are independently testable: the reader is pure, this owns the side effects.
 */

export interface InstalledMod {
  metadata: ModMetadata;
  blockCount: number;
  itemCount: number;
  textureCount: number;
  warnings: string[];
  installedAt: string;
}

const installed = new Map<string, InstalledMod>();

/** Registers a mod's blocks and records it as installed. */
export function installModContents(contents: ModContents): InstalledMod {
  const { metadata } = contents;

  // Re-installing replaces cleanly rather than layering two versions.
  if (installed.has(metadata.modId)) {
    unregisterNamespace(metadata.modId);
  }

  registerBlockSource({
    namespace: metadata.modId,
    label: metadata.name,
    kind: "mod"
  });
  registerBlocks(contents.blocks);

  const record: InstalledMod = {
    metadata,
    blockCount: contents.blocks.length,
    itemCount: contents.itemIds.length,
    textureCount: contents.textures.size,
    warnings: contents.warnings,
    installedAt: new Date().toISOString()
  };
  installed.set(metadata.modId, record);
  return record;
}

/** Reads a jar and installs it. Throws if the archive cannot be opened. */
export async function installModJar(buffer: ArrayBuffer): Promise<InstalledMod> {
  const entries = await readZipEntries(buffer);
  return installModContents(readModContents(entries));
}

/** Removes a mod's blocks from the registry. */
export function uninstallMod(modId: string): boolean {
  if (!installed.has(modId)) return false;
  unregisterNamespace(modId);
  installed.delete(modId);
  return true;
}

export function listInstalledMods(): InstalledMod[] {
  return [...installed.values()];
}

export function isModInstalled(modId: string): boolean {
  return installed.has(modId);
}

/** Test seam. */
export function resetModLibrary(): void {
  for (const modId of installed.keys()) {
    unregisterNamespace(modId);
  }
  installed.clear();
}
