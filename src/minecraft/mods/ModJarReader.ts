import type { BlockDefinition } from "../MinecraftWorldTypes";
import type { ResourcePackEntry } from "../resources/ResourcePackTypes";

/**
 * Reads a Minecraft mod jar.
 *
 * A jar is a ZIP, so no Java is involved: the metadata and every asset a mod
 * ships are plain files inside it. This reader extracts what an animation tool
 * needs — which blocks and items exist, and their textures — and deliberately
 * does NOT attempt to run mod code. Behaviour is irrelevant here; appearance is
 * the whole job.
 *
 * Recognised loaders:
 *   Fabric    fabric.mod.json
 *   Quilt     quilt.mod.json
 *   Forge     META-INF/mods.toml
 *   NeoForge  META-INF/neoforge.mods.toml
 */

export type ModLoader = "fabric" | "quilt" | "forge" | "neoforge" | "unknown";

export interface ModMetadata {
  /** Namespace the mod owns, e.g. "create". */
  modId: string;
  name: string;
  version: string;
  loader: ModLoader;
  authors: string[];
  description: string;
}

export interface ModContents {
  metadata: ModMetadata;
  /** Block definitions discovered from the mod's blockstates. */
  blocks: BlockDefinition[];
  /** Item ids discovered from the mod's item models. */
  itemIds: string[];
  /** Texture paths inside the jar, keyed by their resource location. */
  textures: Map<string, Uint8Array>;
  /** Anything the reader noticed but could not act on. */
  warnings: string[];
}

const decoder = new TextDecoder();

function readText(entries: ResourcePackEntry[], path: string): string | null {
  const entry = entries.find((candidate) => candidate.path.toLowerCase() === path);
  return entry ? decoder.decode(entry.bytes) : null;
}

/**
 * Pulls a handful of fields out of a mods.toml.
 *
 * This is a targeted extraction, not a TOML parser: only modId, displayName,
 * version, authors and description are needed, and pulling in a parser for four
 * keys is not worth the dependency. Anything unrecognised is left alone.
 */
function readModsToml(text: string): Partial<ModMetadata> {
  const field = (key: string): string | undefined => {
    const match = text.match(new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']*)["']`, "mi"));
    return match?.[1];
  };
  const authors = field("authors");
  return {
    modId: field("modId"),
    name: field("displayName"),
    version: field("version"),
    authors: authors ? authors.split(/\s*,\s*/).filter(Boolean) : [],
    description: field("description") ?? ""
  };
}

function readFabricJson(text: string): Partial<ModMetadata> {
  const json = JSON.parse(text) as {
    id?: string;
    name?: string;
    version?: string;
    authors?: Array<string | { name?: string }>;
    description?: string;
  };
  return {
    modId: json.id,
    name: json.name,
    version: json.version,
    authors: (json.authors ?? []).map((author) =>
      typeof author === "string" ? author : author.name ?? ""
    ).filter(Boolean),
    description: json.description ?? ""
  };
}

function readQuiltJson(text: string): Partial<ModMetadata> {
  const json = JSON.parse(text) as {
    quilt_loader?: {
      id?: string;
      version?: string;
      metadata?: { name?: string; description?: string; contributors?: Record<string, string> };
    };
  };
  const loader = json.quilt_loader ?? {};
  return {
    modId: loader.id,
    name: loader.metadata?.name,
    version: loader.version,
    authors: Object.keys(loader.metadata?.contributors ?? {}),
    description: loader.metadata?.description ?? ""
  };
}

/** Identifies the loader and reads its manifest. */
export function readModMetadata(entries: ResourcePackEntry[]): ModMetadata {
  const attempts: Array<{ loader: ModLoader; path: string; parse: (text: string) => Partial<ModMetadata> }> = [
    { loader: "fabric", path: "fabric.mod.json", parse: readFabricJson },
    { loader: "quilt", path: "quilt.mod.json", parse: readQuiltJson },
    { loader: "neoforge", path: "meta-inf/neoforge.mods.toml", parse: readModsToml },
    { loader: "forge", path: "meta-inf/mods.toml", parse: readModsToml }
  ];

  for (const attempt of attempts) {
    const text = readText(entries, attempt.path);
    if (!text) continue;
    let parsed: Partial<ModMetadata>;
    try {
      parsed = attempt.parse(text);
    } catch {
      continue; // Malformed manifest: fall through to the next candidate.
    }
    if (!parsed.modId) continue;
    return {
      modId: parsed.modId,
      name: parsed.name || parsed.modId,
      version: parsed.version || "0.0.0",
      loader: attempt.loader,
      authors: parsed.authors ?? [],
      description: parsed.description ?? ""
    };
  }

  // No manifest: fall back to the namespace the assets folder declares.
  const assetEntry = entries.find((entry) => /^assets\/[^/]+\//i.test(entry.path));
  const namespace = assetEntry?.path.split("/")[1] ?? "unknown";
  return {
    modId: namespace,
    name: namespace,
    version: "0.0.0",
    loader: "unknown",
    authors: [],
    description: ""
  };
}

/** "cogwheel" -> "Cogwheel"; "large_cogwheel" -> "Large Cogwheel". */
function titleCase(path: string): string {
  return path
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Derives a stable colour for a mod block from its id.
 *
 * Real colours come from the mod's own textures once a resource pass runs; this
 * gives every block a distinct, repeatable placeholder in the meantime, so a
 * freshly imported mod is legible rather than uniformly grey.
 */
function deriveColor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  const hue = hash % 360;
  const saturation = 38 + (hash % 22);
  const lightness = 38 + ((hash >> 8) % 18);
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const chroma = (1 - Math.abs(2 * lig - 1)) * sat;
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = lig - chroma / 2;
  const [r, g, b] =
    h < 60 ? [chroma, secondary, 0] :
    h < 120 ? [secondary, chroma, 0] :
    h < 180 ? [0, chroma, secondary] :
    h < 240 ? [0, secondary, chroma] :
    h < 300 ? [secondary, 0, chroma] :
    [chroma, 0, secondary];
  const channel = (value: number) =>
    Math.round((value + match) * 255).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/**
 * Reads a mod jar's contents.
 *
 * Block ids come from `assets/<modid>/blockstates/*.json`: Minecraft requires
 * one blockstate file per block, which makes that folder the authoritative
 * list. Item ids come from `assets/<modid>/models/item/*.json`. Entities are
 * deliberately skipped — they need a rig, not a block definition.
 */
export function readModContents(entries: ResourcePackEntry[]): ModContents {
  const metadata = readModMetadata(entries);
  const warnings: string[] = [];
  const blocks: BlockDefinition[] = [];
  const itemIds: string[] = [];
  const textures = new Map<string, Uint8Array>();
  const seenBlocks = new Set<string>();

  for (const entry of entries) {
    const path = entry.path.replace(/\\/g, "/");
    const blockstate = path.match(/^assets\/([^/]+)\/blockstates\/(.+)\.json$/i);
    if (blockstate) {
      const [, namespace, name] = blockstate;
      const id = `${namespace}:${name}`.toLowerCase();
      if (!seenBlocks.has(id)) {
        seenBlocks.add(id);
        blocks.push({
          id,
          label: titleCase(name),
          color: deriveColor(id),
          transparent: false,
          opacity: 1
        });
      }
      continue;
    }

    const itemModel = path.match(/^assets\/([^/]+)\/models\/item\/(.+)\.json$/i);
    if (itemModel) {
      itemIds.push(`${itemModel[1]}:${itemModel[2]}`.toLowerCase());
      continue;
    }

    const texture = path.match(/^assets\/([^/]+)\/textures\/(.+)\.png$/i);
    if (texture) {
      textures.set(`${texture[1]}:${texture[2]}`.toLowerCase(), entry.bytes);
    }
  }

  if (blocks.length === 0) {
    warnings.push(
      "No blockstates found. This jar may be a library, a dependency, or use a data pack layout."
    );
  }
  if (metadata.loader === "unknown") {
    warnings.push(
      "No loader manifest found; the mod id was inferred from the assets folder."
    );
  }

  return { metadata, blocks, itemIds, textures, warnings };
}
