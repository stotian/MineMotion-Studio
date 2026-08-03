import type { MineMotionProject } from "../../project/ProjectFile";
import type { MinecraftEntityCatalogEntry, MinecraftModDescriptor, MinecraftModLoader } from "./MinecraftStudioTypes";

export interface ModCompatibilityReport {
  compatible: MinecraftModDescriptor[];
  incompatible: MinecraftModDescriptor[];
  warnings: string[];
  namespaces: string[];
  entityCount: number;
  blockCount: number;
  assetCount: number;
}

export function parseModManifest(input: string, expectedLoader: MinecraftModLoader): MinecraftModDescriptor {
  const parsed = JSON.parse(input) as unknown;
  if (!isRecord(parsed)) throw new Error("Mod manifest must be a JSON object.");
  const id = safeId(parsed.id ?? parsed.modId ?? parsed.namespace ?? "mod");
  const loader = normalizeLoader(parsed.loader);
  const descriptor: MinecraftModDescriptor = {
    id,
    name: string(parsed.name, id),
    version: string(parsed.version, "unknown"),
    loader,
    enabled: parsed.enabled !== false,
    namespace: safeNamespace(parsed.namespace ?? id),
    entityIds: normalizeIds(parsed.entityIds ?? parsed.entities),
    blockIds: normalizeIds(parsed.blockIds ?? parsed.blocks),
    assetIds: normalizeIds(parsed.assetIds ?? parsed.assets),
    source: "manifest",
    warnings: []
  };
  if (expectedLoader !== "vanilla" && loader !== "any" && loader !== expectedLoader) descriptor.warnings.push(`Manifest loader ${loader} differs from project loader ${expectedLoader}.`);
  return descriptor;
}

export function upsertModDescriptor(project: MineMotionProject, descriptor: MinecraftModDescriptor): MineMotionProject {
  const mods = project.creationSuite.worldStudio.mods.some((mod) => mod.id === descriptor.id)
    ? project.creationSuite.worldStudio.mods.map((mod) => mod.id === descriptor.id ? descriptor : mod)
    : [...project.creationSuite.worldStudio.mods, descriptor];
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      worldStudio: { ...project.creationSuite.worldStudio, mods }
    }
  };
}

export function removeModDescriptor(project: MineMotionProject, modId: string): MineMotionProject {
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      worldStudio: {
        ...project.creationSuite.worldStudio,
        mods: project.creationSuite.worldStudio.mods.filter((mod) => mod.id !== modId)
      }
    }
  };
}

export function setModEnabled(project: MineMotionProject, modId: string, enabled: boolean): MineMotionProject {
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      worldStudio: {
        ...project.creationSuite.worldStudio,
        mods: project.creationSuite.worldStudio.mods.map((mod) => mod.id === modId ? { ...mod, enabled } : mod)
      }
    }
  };
}

export function analyzeModCompatibility(project: MineMotionProject): ModCompatibilityReport {
  const loader = project.creationSuite.worldStudio.loader;
  const enabled = project.creationSuite.worldStudio.mods.filter((mod) => mod.enabled);
  const compatible = enabled.filter((mod) => loader !== "vanilla" && (mod.loader === "any" || mod.loader === loader));
  const incompatible = enabled.filter((mod) => loader === "vanilla" || (mod.loader !== "any" && mod.loader !== loader));
  const warnings = incompatible.map((mod) => `${mod.name} targets ${mod.loader}, not ${loader}.`);
  return {
    compatible,
    incompatible,
    warnings,
    namespaces: [...new Set(compatible.map((mod) => mod.namespace))],
    entityCount: compatible.reduce((sum, mod) => sum + mod.entityIds.length, 0),
    blockCount: compatible.reduce((sum, mod) => sum + mod.blockIds.length, 0),
    assetCount: compatible.reduce((sum, mod) => sum + mod.assetIds.length, 0)
  };
}

export function listMinecraftEntityCatalog(project: MineMotionProject): MinecraftEntityCatalogEntry[] {
  const vanilla: MinecraftEntityCatalogEntry[] = [
    entry("steve", "Steve", "steve", "steve", ["player", "humanoid"]),
    entry("alex", "Alex", "alex", "alex", ["player", "humanoid"]),
    entry("zombie", "Zombie", "zombie", "mob", ["hostile", "humanoid"]),
    entry("skeleton", "Skeleton", "skeleton", "mob", ["hostile", "humanoid"]),
    entry("creeper", "Creeper", "creeper", "mob", ["hostile", "quadruped"]),
    entry("enderman", "Enderman", "enderman", "mob", ["hostile", "humanoid"]),
    entry("villager", "Villager", "villager", "mob", ["passive", "humanoid"]),
    entry("pig", "Pig", "pig", "mob", ["passive", "quadruped"]),
    entry("cow", "Cow", "cow", "mob", ["passive", "quadruped"]),
    entry("wolf", "Wolf", "wolf", "mob", ["neutral", "quadruped"]),
    entry("spider", "Spider", "spider", "mob", ["hostile", "arthropod"])
  ];
  const modEntries = analyzeModCompatibility(project).compatible.flatMap((mod) => mod.entityIds.map((entityId) => ({
    id: `${mod.namespace}:${entityId.replace(/^.*:/, "")}`,
    name: title(entityId.replace(/^.*:/, "")),
    source: "mod" as const,
    namespace: mod.namespace,
    rigPresetId: "generic_blocky" as const,
    modelType: "generic" as const,
    tags: ["modded", mod.id],
    modId: mod.id
  })));
  return [...vanilla, ...modEntries];
}

function entry(id: MinecraftEntityCatalogEntry["id"], name: string, rigPresetId: MinecraftEntityCatalogEntry["rigPresetId"], modelType: MinecraftEntityCatalogEntry["modelType"], tags: string[]): MinecraftEntityCatalogEntry {
  return { id, name, source: "vanilla", namespace: "minecraft", rigPresetId, modelType, tags };
}
function normalizeLoader(value: unknown): MinecraftModDescriptor["loader"] {
  return ["fabric", "forge", "neoforge", "quilt", "any"].includes(String(value)) ? value as MinecraftModDescriptor["loader"] : "any";
}
function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim().slice(0, 160)))].slice(0, 4096);
}
function safeId(value: unknown): string { return string(value, "mod").toLowerCase().replace(/[^a-z0-9_.-]+/g, "_") || "mod"; }
function safeNamespace(value: unknown): string { return safeId(value).slice(0, 80); }
function string(value: unknown, fallback: string): string { return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : fallback; }
function title(value: string): string { return value.split(/[_-]+/g).map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" "); }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
