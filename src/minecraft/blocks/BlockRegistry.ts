import type { BlockDefinition, BlockId } from "../MinecraftWorldTypes";

/**
 * Runtime block registry.
 *
 * Block ids are OPEN, not a closed union: Minecraft ships around a thousand of
 * them and every mod adds more, so the set cannot be known at compile time.
 * Ids are namespaced ("minecraft:stone", "create:cogwheel"); bare ids are
 * normalised into the minecraft namespace so projects saved before this change
 * keep loading.
 *
 * Sources are tracked so the UI can group blocks by where they came from, and
 * so a mod can be unregistered without disturbing the vanilla catalogue.
 */

export const MINECRAFT_NAMESPACE = "minecraft";

/** Where a block definition came from. */
export interface BlockSource {
  /** Namespace the source owns, e.g. "minecraft" or a mod id. */
  namespace: string;
  /** Human-readable name shown in the block picker. */
  label: string;
  /** Vanilla, an imported mod, or a resource pack. */
  kind: "vanilla" | "mod" | "resourcePack";
}

interface RegistryEntry {
  definition: BlockDefinition;
  namespace: string;
}

const entries = new Map<BlockId, RegistryEntry>();
const sources = new Map<string, BlockSource>();

/** Shown when an id is referenced that nothing has registered. */
const UNKNOWN_BLOCK: BlockDefinition = Object.freeze({
  id: `${MINECRAFT_NAMESPACE}:unknown`,
  label: "Unknown block",
  color: "#b14fd8",
  transparent: false,
  opacity: 1
});

/**
 * Expands a bare id into a namespaced one. Older projects and the Anvil
 * importer both use bare ids like "stone", which must keep resolving.
 */
export function normalizeBlockId(id: string): BlockId {
  const trimmed = id.trim().toLowerCase();
  if (!trimmed) return UNKNOWN_BLOCK.id;
  return trimmed.includes(":") ? trimmed : `${MINECRAFT_NAMESPACE}:${trimmed}`;
}

/** Splits a namespaced id; the namespace defaults to minecraft. */
export function splitBlockId(id: string): { namespace: string; path: string } {
  const normalized = normalizeBlockId(id);
  const index = normalized.indexOf(":");
  return {
    namespace: normalized.slice(0, index),
    path: normalized.slice(index + 1)
  };
}

/** Registers a source (vanilla catalogue, a mod, a resource pack). */
export function registerBlockSource(source: BlockSource): void {
  sources.set(source.namespace, source);
}

/**
 * Adds definitions to the registry. Later registrations win, which lets a
 * resource pack restyle a vanilla block without replacing the catalogue.
 */
export function registerBlocks(definitions: readonly BlockDefinition[]): number {
  let added = 0;
  for (const definition of definitions) {
    const id = normalizeBlockId(definition.id);
    const { namespace } = splitBlockId(id);
    entries.set(id, { definition: { ...definition, id }, namespace });
    added += 1;
  }
  return added;
}

/** Removes everything a namespace registered, e.g. when a mod is disabled. */
export function unregisterNamespace(namespace: string): number {
  let removed = 0;
  for (const [id, entry] of entries) {
    if (entry.namespace !== namespace) continue;
    entries.delete(id);
    removed += 1;
  }
  sources.delete(namespace);
  return removed;
}

/** Looks a block up, falling back to a visible placeholder rather than null. */
export function getBlockDefinition(id: string): BlockDefinition {
  return entries.get(normalizeBlockId(id))?.definition ?? UNKNOWN_BLOCK;
}

/** True when the id resolves to a real registration. */
export function isKnownBlock(id: string): boolean {
  return entries.has(normalizeBlockId(id));
}

/** Every registered id, excluding air and other fully transparent blocks. */
export function listRenderableBlockIds(): BlockId[] {
  const ids: BlockId[] = [];
  for (const [id, entry] of entries) {
    if (entry.definition.opacity <= 0) continue;
    ids.push(id);
  }
  return ids;
}

/** Every registered id, in registration order. */
export function listAllBlockIds(): BlockId[] {
  return [...entries.keys()];
}

/** Registered sources, for grouping in the block picker. */
export function listBlockSources(): BlockSource[] {
  return [...sources.values()];
}

/** Ids belonging to one namespace. */
export function listBlockIdsByNamespace(namespace: string): BlockId[] {
  const ids: BlockId[] = [];
  for (const [id, entry] of entries) {
    if (entry.namespace === namespace) ids.push(id);
  }
  return ids;
}

export function blockRegistrySize(): number {
  return entries.size;
}

/** Test seam: drops every registration and source. */
export function resetBlockRegistry(): void {
  entries.clear();
  sources.clear();
}
